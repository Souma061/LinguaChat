import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  return <div className="p-10 text-xl font-bold">Chat Room: {roomId}</div>;
};
export default RoomPage;
