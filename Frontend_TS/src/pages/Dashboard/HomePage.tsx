import { useAuth } from "../../context/AuthContext";

const HomePage = () => {
  const { logout, user } = useAuth();
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Welcome, {user?.username}!</h1>
      <button onClick={logout} className="mt-4 bg-red-500 text-white p-2 rounded">
        Logout
      </button>
    </div>
  );
};
export default HomePage;
