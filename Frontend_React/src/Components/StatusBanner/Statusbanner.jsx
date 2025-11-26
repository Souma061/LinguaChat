import { useEffect } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import styles from "./StatusBanner.module.css";

function Statusbanner() {
  const { status, setStatus } = useChatContext();

  useEffect(() => {
    if (!status || !status.text) return;

    // Auto-dismiss after different times based on tone
    const duration = status.tone === 'error' ? 5000 : 3000;

    const timer = setTimeout(() => {
      setStatus(null);
    }, duration);

    return () => clearTimeout(timer);
  }, [status, setStatus]);

  if (!status || !status.text) {
    return null;
  }

  return (
    <div className={`${styles.banner} ${styles[status.tone]}`}>
      {status.text}
    </div>
  );
}

export default Statusbanner;
