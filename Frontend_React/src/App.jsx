import './App.css';
import ChatPanel from "./Components/ChatPanel/ChatPanel";
import LoginPanel from "./Components/LoginPanel/LoginPanel";
import Statusbanner from "./Components/StatusBanner/Statusbanner";
import UserList from "./Components/UserList/UserList";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useChatContext } from "./hooks/useChatContext";

function AppContent() {
  const { isJoined } = useChatContext();

  return (
    <>
      <Statusbanner />
      <div className="app">
        {!isJoined ? (
          <LoginPanel />
        ) : (
          <>
            <UserList />
            <ChatPanel />
          </>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
