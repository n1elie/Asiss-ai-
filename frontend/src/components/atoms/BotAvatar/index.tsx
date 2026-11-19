import LogoMark from '../LogoMark';
import styles from './styles.module.css';

interface Props {
  large?: boolean;
}

export default function BotAvatar({ large }: Props) {
  return (
    <div className={`${styles.avatar} ${large ? styles.large : ''}`} aria-hidden="true">
      <LogoMark className={styles.mark} />
    </div>
  );
}
