import LogoMark from '../LogoMark';
import styles from './styles.module.css';

export default function AppLogo() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBox}>
        <LogoMark className={styles.mark} />
      </div>
      <div className={styles.text}>
        <span className={styles.title}>Insure.AI</span>
        <span className={styles.status}>
          <span className={styles.dot} />
          Ready to assist
        </span>
      </div>
    </div>
  );
}
