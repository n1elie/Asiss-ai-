import { CheckOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

interface Props {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

export default function StepCircle({ number, label, isActive, isCompleted }: Props) {
  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.circle} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
      >
        {isCompleted ? <CheckOutlined style={{ fontSize: 11 }} /> : number}
      </div>
      <span className={`${styles.label} ${isActive ? styles.activeLabel : ''}`}>{label}</span>
    </div>
  );
}
