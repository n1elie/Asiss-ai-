import { SendOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function SendButton({ onClick, disabled }: Props) {
  return (
    <button className={styles.btn} onClick={onClick} disabled={disabled} aria-label="Send message">
      <SendOutlined />
    </button>
  );
}
