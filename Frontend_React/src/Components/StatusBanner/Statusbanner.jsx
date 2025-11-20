import { useChatContext } from "../../hooks/useChatContext";
import styles from "./StatusBanner.module.css";

function Statusbanner() {
  const { status } = useChatContext();

  if (!status || !status.text) {
    return null;
  }
  return (
      <div className={`${styles.banner} ${styles[status.tone]}`}>
      {status.text}
    </div>

  );
}

export default Statusbanner
