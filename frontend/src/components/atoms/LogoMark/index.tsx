interface Props {
  className?: string;
}

export default function LogoMark({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.3v5.2c0 4.4 3.2 8.2 7.5 9.2V2.5Z"
        fill="currentColor"
      />
      <path
        d="M12 2.5 4.5 5.3v5.2c0 4.4 3.2 8.2 7.5 9.2 4.3-1 7.5-4.8 7.5-9.2V5.3L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
