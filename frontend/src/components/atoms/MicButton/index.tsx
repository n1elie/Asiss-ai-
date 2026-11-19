import { AudioOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

interface Props {
  isListening: boolean;
  onClick: () => void;
}

export default function MicButton({ isListening, onClick }: Props) {
  return (
    <button
      className={`${styles.btn} ${isListening ? styles.listening : ''}`}
      onClick={onClick}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
    >
      <AudioOutlined />
      {isListening && <span className={styles.pulse} />}
    </button>
  );
}
