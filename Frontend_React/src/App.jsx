import './App.css';
import ChatPanel from "./Components/ChatPanel/ChatPanel";
import LoginPanel from "./Components/LoginPanel/LoginPanel";
import Statusbanner from "./Components/StatusBanner/Statusbanner";
import UserList from "./Components/UserList/UserList";
import { ChatProvider } from "./context/ChatContext";
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
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;
