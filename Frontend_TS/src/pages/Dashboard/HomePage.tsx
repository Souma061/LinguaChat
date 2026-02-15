import {
  Globe,
  LayoutGrid, List as ListIcon,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/chatContext';
import api from '../../services/api';

interface Room {
  _id: string;
  name: string;
  description: string;
  mode: 'Global' | 'Native';
  members: string[];
}

const HomePage = () => {
  const { user, logout } = useAuth();
  const { socket } = useChat();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Create Room State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMode, setNewRoomMode] = useState<'Global' | 'Native'>('Global');

  useEffect(() => {
    fetchRooms();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleRoomCreated = () => fetchRooms();
    socket.on('room_created', handleRoomCreated);
    return () => { socket.off('room_created', handleRoomCreated); };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      // Fake delay to show off the skeleton loader (Remove in production)
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;
    socket.emit('create_room', { name: newRoomName, mode: newRoomMode });
    setShowCreateModal(false);
    setNewRoomName('');
  };

  // --- SUB-COMPONENTS FOR CLEANER CODE ---

  const RoomCard = ({ room }: { room: Room }) => (
    <div
      onClick={() => navigate(`/room/${room.name}`)}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >

      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${room.mode === 'Global' ? 'from-purple-500/10 to-blue-500/10' : 'from-green-500/10 to-teal-500/10'
        } rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${room.mode === 'Global'
            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
            }`}>
            {room.mode === 'Global' ? <Globe className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${room.mode === 'Global'
            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200'
            : 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-200'
            }`}>
            {room.mode}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {room.name}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
          {room.description || "Join the conversation in this room."}
        </p>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4 mr-2" />
          <span>{room.members?.length || 0} active members</span>
        </div>
      </div>
    </div>
  );

  const RoomSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">


      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                LinguaChat
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-md">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-2">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your conversations and join active rooms.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Toggle (Grid/List) - Professional touch */}
            <div className="hidden sm:flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-400'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-400'}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </button>
          </div>
        </div>


        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <RoomSkeleton key={i} />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
            <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No rooms found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              It's quiet in here. Why not create the first room and invite others?
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 text-indigo-600 hover:text-indigo-500 font-medium text-sm"
            >
              Create a new room &rarr;
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {rooms.map((room) => <RoomCard key={room._id} room={room} />)}
          </div>
        )}
      </main>


      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">

          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl transform transition-all relative z-10">

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create New Room</h3>
              <p className="text-sm text-gray-500 mb-6">Setup a space for your team to collaborate.</p>

              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room Name</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. Marketing Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">

                    <div
                      onClick={() => setNewRoomMode('Global')}
                      className={`cursor-pointer relative rounded-xl border-2 p-4 transition-all ${newRoomMode === 'Global'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Globe className={`h-6 w-6 ${newRoomMode === 'Global' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        {newRoomMode === 'Global' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">Global</p>
                      <p className="text-xs text-gray-500 mt-1">AI Translation Enabled</p>
                    </div>


                    <div
                      onClick={() => setNewRoomMode('Native')}
                      className={`cursor-pointer relative rounded-xl border-2 p-4 transition-all ${newRoomMode === 'Native'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Zap className={`h-6 w-6 ${newRoomMode === 'Native' ? 'text-green-600' : 'text-gray-400'}`} />
                        {newRoomMode === 'Native' && <div className="h-2 w-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">Native</p>
                      <p className="text-xs text-gray-500 mt-1">Raw Speed (No AI)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
