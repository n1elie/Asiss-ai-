'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleFilled,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LaptopOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonOutlined,
  PlusOutlined,
  SaveOutlined,
  SunOutlined,
  UndoOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Modal, Select, Spin } from 'antd';
import AppLogo from '@/components/atoms/AppLogo';
import BotAvatar from '@/components/atoms/BotAvatar';
import MicButton from '@/components/atoms/MicButton';
import SendButton from '@/components/atoms/SendButton';
import StatusBadge from '@/components/atoms/StatusBadge';
import StepCircle from '@/components/atoms/StepCircle';
import { useThemeMode, type ThemeMode } from '@/components/Providers';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { createSession, updateLanguage } from '@/lib/api';
import { localizeProduct, normalizeLanguage, t } from '@/lib/i18n';
import {
  forgetQuotation,
  getRecentQuotations,
  getServerRecentQuotations,
  rememberQuotation,
  subscribeRecentQuotations,
} from '@/lib/recentQuotations';
import type { ChatMessage, InsuranceProduct, RiskInformation, QuotationSession } from '@/lib/types';
import { getPreferredLanguage, useSessionStore } from '@/store/sessionStore';
import styles from './styles.module.css';

type StepKey = 'stepProduct' | 'stepDetails' | 'stepRisks' | 'stepQuote';

const STEPS = [
  { number: 1, key: 'stepProduct' },
  { number: 2, key: 'stepDetails' },
  { number: 3, key: 'stepRisks' },
  { number: 4, key: 'stepQuote' },
] as const;

const STEP_LABELS: Record<'English' | 'French', Record<StepKey, string>> = {
  English: {
    stepProduct: 'Select product',
    stepDetails: 'Capture details',
    stepRisks: 'Review risks',
    stepQuote: 'Quotation',
  },
  French: {
    stepProduct: 'Choisir un produit',
    stepDetails: 'Saisir les détails',
    stepRisks: 'Évaluer les risques',
    stepQuote: 'Devis',
  },
};

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'French', label: 'Français' },
];

function formatTime(value: string | null | undefined, language: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(normalizeLanguage(language) === 'French' ? 'fr-FR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function RichText({ content }: { content: string }) {
  return (
    <>
      {content.split('\n').map((line, index) => (
        <span key={index} className={styles.line}>
          {renderInline(line)}
        </span>
      ))}
    </>
  );
}

function riskEntries(session: QuotationSession, language: string | undefined) {
  const risk: RiskInformation = session.risk_information;
  const fields: Record<string, { label: string; value?: string }[]> = {
    motor: [
      {
        label: t(language, 'vehicle'),
        value: [risk.vehicle_make, risk.vehicle_year].filter(Boolean).join(' · '),
      },
      { label: t(language, 'vehicleValue'), value: risk.vehicle_value },
    ],
    fire: [
      { label: t(language, 'propertyType'), value: risk.property_type },
      { label: t(language, 'location'), value: risk.property_location },
      { label: t(language, 'propertyValue'), value: risk.property_value },
    ],
    travel: [
      { label: t(language, 'destination'), value: risk.destination },
      { label: t(language, 'travelDates'), value: risk.travel_dates },
      { label: t(language, 'travellers'), value: risk.num_travelers },
    ],
    personal_accident: [
      { label: t(language, 'occupation'), value: risk.occupation },
      { label: t(language, 'age'), value: risk.age },
      { label: t(language, 'coverage'), value: risk.coverage_amount },
    ],
  };
  return (fields[session.selected_product ?? ''] ?? []).filter((item) => item.value);
}

function MessageRow({ message, language }: { message: ChatMessage; language: string | undefined }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`${styles.messageRow} ${isAssistant ? styles.assistantRow : styles.userRow}`}>
      {isAssistant && <BotAvatar />}
      <div className={styles.messageBody}>
        <div className={`${styles.bubble} ${isAssistant ? styles.assistantBubble : styles.userBubble}`}>
          <RichText content={message.content} />
        </div>
        <span className={`${styles.messageMeta} ${!isAssistant ? styles.userMeta : ''}`}>
          {t(language, isAssistant ? 'assistant' : 'you')} · {formatTime(message.timestamp, language)}
        </span>
      </div>
    </div>
  );
}

function ProductGrid({
  products,
  language,
  disabled,
  onSelect,
}: {
  products: InsuranceProduct[];
  language: string | undefined;
  disabled: boolean;
  onSelect: (product: InsuranceProduct, label: string) => void;
}) {
  if (!products.length) return null;
  return (
    <div className={styles.productGrid}>
      {products.map((product) => {
        const localized = localizeProduct(product, language);
        return (
          <button
            key={product.id}
            type="button"
            className={styles.productCard}
            onClick={() => onSelect(product, localized.name)}
            disabled={disabled}
          >
            <span className={styles.productIcon}>{product.icon}</span>
            <span className={styles.productText}>
              <span className={styles.productName}>{localized.name}</span>
              <span className={styles.productDescription}>{localized.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryField({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value?: string | null;
  emptyLabel: string;
}) {
  return (
    <div className={styles.summaryField}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={value ? styles.summaryValue : styles.summaryEmpty}>{value || emptyLabel}</span>
    </div>
  );
}

export default function SessionLayout({ sessionId }: { sessionId: string }) {
  const {
    session,
    messages,
    products,
    isLoading,
    isSaving,
    loadSession,
    sendMessage,
    selectProduct,
    saveSession,
    reopenSession,
    setLanguage,
  } = useSessionStore();

  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const recents = useSyncExternalStore(
    subscribeRecentQuotations,
    getRecentQuotations,
    getServerRecentQuotations
  );

  const [input, setInput] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [startOverOpen, setStartOverOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } =
    useVoiceInput();

  useEffect(() => {
    loadSession(sessionId).catch(() => setLoadError(true));
  }, [loadSession, sessionId]);

  useEffect(() => {
    if (session) rememberQuotation(session);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const isSaved = session?.status === 'SAVED';
  const done = session?.status === 'COMPLETE' || isSaved;
  const canSelectProduct = session?.current_step === 'PRODUCT_SELECTION';
  const risks = session ? riskEntries(session, session.language) : [];
  const composerValue = input || transcript;

  const submit = () => {
    const value = composerValue.trim();
    if (!value || isLoading || !session) return;
    setInput('');
    resetTranscript();
    void sendMessage(value);
  };

  const onSelectProduct = (product: InsuranceProduct, label: string) => {
    if (isLoading || !canSelectProduct) return;
    void selectProduct(product, label);
  };

  const startNewSession = async () => {
    setStartOverOpen(false);
    setNavOpen(false);
    setSummaryOpen(false);
    try {
      const created = await createSession();
      const preferred = getPreferredLanguage();
      if (preferred && preferred !== created.language) {
        await updateLanguage(created.session_id, preferred);
      }
      router.push(`/session/${created.session_id}`);
    } catch {
      router.push('/');
    }
  };

  const logout = () => {
    setLogoutOpen(false);
    setSummaryOpen(false);
    setNavOpen(false);
    router.push('/signed-out');
  };

  const toggleSummary = () => {
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 1080px)').matches;
    if (isMobile) {
      setSummaryOpen((open) => !open);
    } else {
      setSidebarVisible((visible) => !visible);
    }
  };

  const accountItems = [
    { key: 'add', icon: <UserAddOutlined />, label: t(session?.language, 'addAccount') },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t(session?.language, 'logout'),
      danger: true,
    },
  ];

  if (loadError) {
    return (
      <div className={styles.centerState}>
        <p>{t(session?.language, 'sessionLoadError')}</p>
        <Button type="primary" onClick={() => router.push('/')}>
          {t(session?.language, 'startNewSession')}
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.centerState}>
        <Spin size="large" />
        <p>{t(undefined, 'loadingSession')}</p>
      </div>
    );
  }

  const language = session.language;
  const conversationStarted = messages.some((message) => message.role === 'user');
  const themeIcon =
    themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <LaptopOutlined />;
  const themeLabel = t(
    language,
    themeMode === 'light' ? 'themeLight' : themeMode === 'dark' ? 'themeDark' : 'themeSystem'
  );
  const themeItems = [
    { key: 'system', icon: <LaptopOutlined />, label: t(language, 'themeSystem') },
    { key: 'light', icon: <SunOutlined />, label: t(language, 'themeLight') },
    { key: 'dark', icon: <MoonOutlined />, label: t(language, 'themeDark') },
  ];

  const summary = (
    <aside className={styles.summary}>
      <div className={styles.summaryHeader}>
        <h2>{t(language, 'sessionSummary')}</h2>
        <button
          type="button"
          className={styles.closeSummary}
          onClick={() => {
            setSummaryOpen(false);
            setSidebarVisible(false);
          }}
          aria-label={t(language, 'hideSummary')}
        >
          <CloseOutlined />
        </button>
      </div>

      <div className={styles.summaryStatusRow}>
        <span className={styles.summaryLabel}>{t(language, 'status')}</span>
        <StatusBadge status={session.status} language={language} />
      </div>

      <div className={styles.summaryMetaGrid}>
        <span className={styles.summaryLabel}>{t(language, 'quotationRef')}</span>
        <span className={styles.summaryValueRight}>{session.quotation_ref}</span>
        <span className={styles.summaryLabel}>{t(language, 'timeStarted')}</span>
        <span className={styles.summaryValueRight}>{formatTime(session.time_started, language)}</span>
      </div>

      <section className={styles.summarySection}>
        <h3>{t(language, 'insuranceProduct')}</h3>
        {session.selected_product_name ? (
          <div className={styles.selectedProduct}>
            <CheckCircleFilled />
            <span>
              {localizeProduct(
                {
                  id: session.selected_product ?? '',
                  name: session.selected_product_name,
                  description: '',
                },
                language
              ).name}
            </span>
          </div>
        ) : (
          <p className={styles.summaryHint}>{t(language, 'selectToContinue')}</p>
        )}
      </section>

      <section className={styles.summarySection}>
        <h3>{t(language, 'insuredParty')}</h3>
        <SummaryField
          label={t(language, 'fullName')}
          value={session.insured_party.full_name}
          emptyLabel={t(language, 'notProvided')}
        />
        <SummaryField
          label={t(language, 'idRegistration')}
          value={session.insured_party.id_registration}
          emptyLabel={t(language, 'notProvided')}
        />
        <SummaryField
          label={t(language, 'contactNumber')}
          value={session.insured_party.contact_number}
          emptyLabel={t(language, 'notProvided')}
        />
      </section>

      <section className={styles.summarySection}>
        <h3>{t(language, 'riskInformation')}</h3>
        {!session.selected_product ? (
          <p className={styles.summaryHint}>{t(language, 'selectProductToStart')}</p>
        ) : risks.length ? (
          risks.map((item) => (
            <SummaryField
              key={item.label}
              label={item.label}
              value={item.value}
              emptyLabel={t(language, 'notProvided')}
            />
          ))
        ) : (
          <p className={styles.summaryHint}>{t(language, 'waitingRisk')}</p>
        )}
      </section>

      {session.quotation_amount && (
        <section className={styles.quoteBox}>
          <span>{t(language, 'annualPremium')}</span>
          <strong>{session.quotation_amount}</strong>
        </section>
      )}

      <section className={styles.summarySection}>
        <h3>{t(language, 'account')}</h3>
        <div className={styles.accountCard}>
          <span className={styles.summaryAvatar}>D</span>
          <div className={styles.accountCardText}>
            <span className={styles.accountCardName}>David</span>
            <span className={styles.accountCardMeta}>{t(language, 'myAccount')}</span>
          </div>
        </div>
      </section>

      <div className={styles.summaryActions}>
        <Button
          type="primary"
          size="large"
          block
          icon={<SaveOutlined />}
          loading={isSaving}
          disabled={isSaved}
          onClick={() => void saveSession()}
          className={styles.saveButton}
        >
          {isSaved ? t(language, 'progressSaved') : t(language, 'saveProgress')}
        </Button>

        {isSaved && (
          <Button
            size="large"
            block
            icon={<UndoOutlined />}
            loading={isSaving}
            onClick={() => void reopenSession()}
            className={styles.undoButton}
          >
            {t(language, 'undoSave')}
          </Button>
        )}

        <Button
          type="text"
          block
          icon={<PlusOutlined />}
          onClick={() => setStartOverOpen(true)}
        >
          {t(language, 'startOver')}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className={`${styles.app} ${!sidebarVisible ? styles.summaryCollapsed : ''}`}>
      <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarBrandRow}>
            <AppLogo />
            <button
              type="button"
              className={styles.sidebarClose}
              onClick={() => setNavOpen(false)}
              aria-label={t(language, 'closeMenu')}
            >
              <CloseOutlined />
            </button>
          </div>

          <button
            type="button"
            className={styles.newQuotation}
            onClick={() => void startNewSession()}
          >
            <PlusOutlined />
            <span>{t(language, 'newQuotation')}</span>
          </button>
        </div>

        <div className={styles.recentBlock}>
          <span className={styles.recentLabel}>{t(language, 'recent')}</span>
          {recents.length ? (
            <div className={styles.recentList}>
              {recents.map((item) => {
                const productName = item.productId
                  ? localizeProduct(
                      { id: item.productId, name: item.productName ?? '', description: '' },
                      language
                    ).name
                  : item.productName;
                const label = productName || item.customer || item.ref;
                const isActive = item.id === sessionId;
                return (
                  <div
                    key={item.id}
                    className={`${styles.recentItem} ${isActive ? styles.recentItemActive : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.recentOpen}
                      onClick={() => {
                        setNavOpen(false);
                        if (!isActive) router.push(`/session/${item.id}`);
                      }}
                      title={label}
                    >
                      <MessageOutlined className={styles.recentIcon} />
                      <span className={styles.recentText}>
                        <span className={styles.recentTitle}>{label}</span>
                        <span className={styles.recentRef}>{item.ref}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.recentDelete}
                      aria-label={t(language, 'deleteRecent')}
                      title={t(language, 'deleteRecent')}
                      onClick={() => forgetQuotation(item.id)}
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.recentEmpty}>{t(language, 'noRecent')}</p>
          )}
        </div>

        <div className={styles.sidebarBottom}>
          <Dropdown
            menu={{
              items: themeItems,
              selectable: true,
              selectedKeys: [themeMode],
              onClick: ({ key }) => setThemeMode(key as ThemeMode),
            }}
            trigger={['click']}
            placement="topLeft"
          >
            <button type="button" className={styles.sidebarAction}>
              {themeIcon}
              <span className={styles.sidebarActionLabel}>{t(language, 'theme')}</span>
              <span className={styles.sidebarActionMeta}>{themeLabel}</span>
            </button>
          </Dropdown>

          <Dropdown
            menu={{
              items: accountItems,
              onClick: ({ key }) => {
                if (key === 'add') {
                  void startNewSession();
                } else if (key === 'logout') {
                  setLogoutOpen(true);
                }
              },
            }}
            trigger={['click']}
            placement="topLeft"
          >
            <button type="button" className={styles.accountButton}>
              <span className={styles.agentAvatar}>D</span>
              <span className={styles.accountText}>
                <span className={styles.accountName}>David</span>
                <span className={styles.accountMeta}>{t(language, 'myAccount')}</span>
              </span>
              <DownOutlined className={styles.accountChevron} />
            </button>
          </Dropdown>
        </div>
      </aside>

      {navOpen && (
        <button
          type="button"
          className={styles.navOverlay}
          onClick={() => setNavOpen(false)}
          aria-label={t(language, 'closeMenu')}
        />
      )}

      <div className={styles.mainColumn}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setNavOpen(true)}
                aria-label={t(language, 'openMenu')}
              >
                <MenuOutlined />
              </button>
              <div className={styles.headerIdentity}>
                <span className={styles.workspaceName}>{t(language, 'assistantName')}</span>
                <DownOutlined className={styles.workspaceChevron} />
              </div>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.languagePicker} aria-label={t(language, 'language')}>
                <GlobalOutlined />
                <Select
                  variant="borderless"
                  value={normalizeLanguage(session.language)}
                  options={LANGUAGES}
                  onChange={(value) => void setLanguage(value)}
                  popupMatchSelectWidth={false}
                />
              </div>

              <button
                type="button"
                className={styles.summaryToggle}
                onClick={toggleSummary}
                aria-label={sidebarVisible ? t(language, 'hideSummary') : t(language, 'showSummary')}
              >
                <FileTextOutlined />
                <span className={styles.summaryToggleText}>
                  {sidebarVisible ? t(language, 'hideSummary') : t(language, 'showSummary')}
                </span>
              </button>
            </div>
          </div>

          <nav className={styles.stepper} aria-label={t(language, 'progress')}>
            {STEPS.map((step, index) => {
              const isActive = session.step_number === step.number && !done;
              const isCompleted = session.step_number > step.number || done;
              return (
                <div key={step.number} className={styles.stepWrap}>
                  <StepCircle
                    number={step.number}
                    label={STEP_LABELS[normalizeLanguage(language)][step.key]}
                    isActive={isActive}
                    isCompleted={isCompleted}
                  />
                  {index < STEPS.length - 1 && (
                    <span className={`${styles.stepLine} ${isCompleted ? styles.stepLineDone : ''}`} />
                  )}
                </div>
              );
            })}
          </nav>
        </header>

        <main className={styles.chatArea}>
          <div className={`${styles.chatInner} ${!conversationStarted ? styles.chatInnerEmpty : ''}`}>
            {!conversationStarted ? (
              <div className={styles.heroStage}>
                <div className={styles.hero}>
                  <BotAvatar large />
                  <span className={styles.welcomeKicker}>{t(language, 'assistant')}</span>
                  <h1>{t(language, 'welcome')}</h1>
                  <p>{t(language, 'welcomeSubtitle')}</p>
                </div>

                {canSelectProduct && (
                  <div className={styles.productsBlock}>
                    <span className={styles.productsLabel}>{t(language, 'insuranceProduct')}</span>
                    <ProductGrid
                      products={products}
                      language={language}
                      disabled={isLoading}
                      onSelect={onSelectProduct}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} language={language} />
                ))}

                {canSelectProduct && (
                  <div className={styles.productsBlock}>
                    <span className={styles.productsLabel}>{t(language, 'insuranceProduct')}</span>
                    <ProductGrid
                      products={products}
                      language={language}
                      disabled={isLoading}
                      onSelect={onSelectProduct}
                    />
                  </div>
                )}

                {isLoading && (
                  <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                    <BotAvatar />
                    <div className={styles.typing}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className={styles.composerArea}>
          <div className={styles.composer}>
            <textarea
              value={composerValue}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={t(language, 'composerPlaceholder')}
              aria-label="Message"
              disabled={isLoading}
            />
            <div className={styles.composerActions}>
              {isSupported && (
                <MicButton
                  isListening={isListening}
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      setInput('');
                      startListening();
                    }
                  }}
                />
              )}
              <SendButton onClick={submit} disabled={!composerValue.trim() || isLoading} />
            </div>
          </div>
          <span className={styles.composerHint}>{t(language, 'composerHint')}</span>
        </div>
      </div>

      <div className={styles.summaryColumn}>{summary}</div>
      {summaryOpen && (
        <div className={styles.mobileSummary}>
          <button
            type="button"
            className={styles.mobileOverlay}
            onClick={() => setSummaryOpen(false)}
            aria-label={t(language, 'hideSummary')}
          />
          {summary}
        </div>
      )}

      <Modal
        open={logoutOpen}
        title={t(language, 'logoutTitle')}
        okText={t(language, 'confirmLogout')}
        cancelText={t(language, 'cancel')}
        onCancel={() => setLogoutOpen(false)}
        onOk={logout}
      >
        <p>{t(language, 'logoutBody')}</p>
      </Modal>

      <Modal
        open={startOverOpen}
        title={t(language, 'startOverTitle')}
        okText={t(language, 'confirmStartOver')}
        cancelText={t(language, 'cancel')}
        onCancel={() => setStartOverOpen(false)}
        onOk={() => void startNewSession()}
      >
        <p>{t(language, 'startOverBody')}</p>
      </Modal>
    </div>
  );
}
