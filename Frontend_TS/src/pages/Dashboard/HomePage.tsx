import {
  ChatCircleDots,
  ChatsCircle,
  Check,
  Crown,
  SquaresFour as LayoutGrid,
  Link as Link2,
  List as ListIcon,
  SignOut as LogOut,
  ChatCircle as MessageSquare,
  QrCode,
  MagnifyingGlass as Search,
  Gear as Settings,
  ShareNetwork as Share2,
  Shield,
  Translate,
  Trash as Trash2,
  Users,
  X
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/chatContext";
import ThemeToggle from "../../components/ThemeToggle";
import api from "../../services/api";

interface RoomOwner {
  _id: string;
  username: string;
}

interface Room {
  _id: string;
  name: string;
  description: string;
  mode: "Global" | "Native";
  members: string[];
  admins: string[];
  owner: RoomOwner | string;
  createdAt: string;
}

const HomePage = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected, connectionError } = useChat();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMode, setNewRoomMode] = useState<"Global" | "Native">("Global");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [shareRoom, setShareRoom] = useState<Room | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [manageRoom, setManageRoom] = useState<Room | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!socket) return;
    const handleRoomCreated = () => fetchRooms();
    socket.on("room_created", handleRoomCreated);
    return () => {
      socket.off("room_created", handleRoomCreated);
    };
  }, [socket, fetchRooms]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newRoomName.trim();

    if (!trimmedName) {
      setCreateError("Room name is required");
      return;
    }
    if (trimmedName.length < 3) {
      setCreateError("Room name must be at least 3 characters");
      return;
    }

    if (!socket || !isConnected) {
      setCreateError(
        connectionError ||
        "Socket not connected. Please refresh or login again.",
      );
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    const onCreated = (data: { name: string }) => {
      window.clearTimeout(timeoutId);
      socket.off("error_event", onError);
      setIsCreating(false);
      setShowCreateModal(false);
      setNewRoomName("");
      fetchRooms();
      const target = data?.name || trimmedName;
      navigate(`/room/${encodeURIComponent(target)}`);
    };

    const onError = (err: { message?: string } | null) => {
      window.clearTimeout(timeoutId);
      setIsCreating(false);
      socket.off("room_created", onCreated);
      socket.off("error_event", onError);
      setCreateError(err?.message || "Failed to create room");
    };

    socket.once("room_created", onCreated);
    socket.once("error_event", onError);

    const timeoutId = window.setTimeout(() => {
      socket.off("room_created", onCreated);
      socket.off("error_event", onError);
      setIsCreating(false);
      setCreateError("Timed out while creating room");
    }, 7000);

    socket.emit("create_room", { name: trimmedName, mode: newRoomMode });
  };

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = joinRoomId.trim();
    if (!trimmedInput) {
      setJoinError("Please enter a Room ID or Name");
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      const res = await api.get(`/rooms/${encodeURIComponent(trimmedInput)}`);
      const room = res.data;
      if (room?.name) {
        setShowJoinModal(false);
        setJoinRoomId("");
        navigate(`/room/${encodeURIComponent(room.name)}`);
      } else {
        setJoinError("Room not found");
      }
    } catch {
      setJoinError("Room not found. Check the ID or name and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleUpdateMode = async (
    roomId: string,
    newMode: "Global" | "Native",
  ) => {
    setIsUpdating(true);
    try {
      await api.patch(`/rooms/${roomId}/mode`, { mode: newMode });
      setRooms((prev) =>
        prev.map((r) => (r._id === roomId ? { ...r, mode: newMode } : r)),
      );
      if (manageRoom && manageRoom._id === roomId) {
        setManageRoom({ ...manageRoom, mode: newMode });
      }
    } catch (error) {
      console.error("Failed to update mode", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/rooms/${roomId}`);
      setManageRoom(null);
      setConfirmDelete(false);
      fetchRooms();
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      setDeleteError(
        axiosError.response?.data?.error || "Failed to delete room. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to copy to clipboard", err);
    });
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const getOwnerName = useCallback((room: Room): string => {
    if (room.owner && typeof room.owner === "object" && room.owner.username) {
      return room.owner.username;
    }
    return "Unknown";
  }, []);

  const getUserRole = useCallback(
    (room: Room): "owner" | "admin" | "member" => {
      if (!user) return "member";
      const ownerId =
        room.owner && typeof room.owner === "object"
          ? room.owner._id
          : room.owner || "";
      if (ownerId === user.id) return "owner";
      if (room.admins?.some((id) => id === user.id)) return "admin";
      return "member";
    },
    [user],
  );

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().indexOf(q) !== -1 ||
        (r.description && r.description.toLowerCase().indexOf(q) !== -1),
    );
  }, [rooms, searchQuery]);

  const getRoomLink = useCallback((room: Room) => {
    return `${window.location.origin}/room/${encodeURIComponent(room.name)}`;
  }, []);

  const getQrUrl = useCallback(
    (room: Room) => {
      const link = getRoomLink(room);
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}&bgcolor=1a1a2e&color=ffffff`;
    },
    [getRoomLink],
  );

  const RoleBadge = ({ role }: { role: "owner" | "admin" | "member" }) => {
    if (role === "owner") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Crown className="h-2.5 w-2.5" />
          Owner
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </span>
      );
    }
    return null;
  };

  const RoomCard = ({ room }: { room: Room }) => {
    const role = getUserRole(room);
    const ownerName = getOwnerName(room);

    return (
      <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${room.mode === "Global"
            ? "from-purple-500/10 to-blue-500/10"
            : "from-green-500/10 to-teal-500/10"
            } rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}
        />

        <div
          onClick={() => navigate(`/room/${encodeURIComponent(room.name)}`)}
          className="relative z-10 p-6 pb-3 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-3 rounded-xl ${room.mode === "Global"
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                }`}
            >
              {room.mode === "Global" ? (
                <Translate className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" weight="regular" />
              ) : (
                <ChatCircleDots className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" weight="regular" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <RoleBadge role={role} />
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${room.mode === "Global"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200"
                  : "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-200"
                  }`}
              >
                {room.mode}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {room.name}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {room.description || "Join the conversation in this room."}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" weight="regular" />
              <span>{room.members?.length || 0} members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" weight="fill" />
              <span>{ownerName}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-gray-100 dark:border-gray-700 px-6 py-2.5 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate max-w-[140px]">
            ID: {room._id}
          </span>
          <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
            {(role === "owner" || role === "admin") && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setManageRoom(room);
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-600 shadow-sm transition-all"
                title="Room Settings"
              >
                <Settings className="h-4 w-4 transition-transform group-hover:rotate-90 duration-500" weight="regular" />
              </button>
            )}
            <div className="w-px bg-gray-200 dark:bg-gray-600 mx-1 my-1" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareRoom(room);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-all group/share"
            >
              <Share2 className="h-4 w-4 group-hover/share:scale-110 transition-transform" weight="regular" />
              Share
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  const qrImgRef = useRef<HTMLImageElement>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                LinguaChat
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div className="h-8 w-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-md">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-2">
                  {user?.username}
                </span>
              </div>
              <ThemeToggle />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your conversations and join active rooms.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden sm:flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-gray-100 dark:bg-gray-700 text-indigo-600"
                  : "text-gray-400"
                  }`}
              >
                <LayoutGrid className="h-5 w-5" weight="regular" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list"
                  ? "bg-gray-100 dark:bg-gray-700 text-indigo-600"
                  : "text-gray-400"
                  }`}
              >
                <ListIcon className="h-5 w-5" weight="regular" />
              </button>
            </div>

            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Join by ID/Name
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
              <ChatsCircle className="h-6 w-6 mr-2 transition-transform group-hover:scale-110" weight="bold" />
              Create Room
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" weight="regular" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
            <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {searchQuery ? "No rooms match your search" : "No rooms found"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try a different search term."
                : "It's quiet in here. Why not create the first room and invite others?"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Create a new room &rarr;
              </button>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-6 ${viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
              }`}
          >
            {filteredRooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl transform transition-all relative z-10 animate-fade-in-scale">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Create New Room
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Setup a space for your team to collaborate. You'll be the admin.
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. Marketing Team"
                  />
                </div>

                {(createError || connectionError) && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {createError || connectionError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setNewRoomMode("Global")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setNewRoomMode("Global");
                        }
                      }}
                      className={`cursor-pointer relative rounded-xl border-2 p-4 transition-all ${newRoomMode === "Global"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      role="button"
                      aria-pressed={newRoomMode === "Global"}
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Translate
                          className={`h-6 w-6 ${newRoomMode === "Global"
                            ? "text-indigo-600"
                            : "text-gray-400"
                            }`}
                        />
                        {newRoomMode === "Global" && (
                          <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Global
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        AI Translation Enabled
                      </p>
                    </div>

                    <div
                      onClick={() => setNewRoomMode("Native")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setNewRoomMode("Native");
                        }
                      }}
                      className={`cursor-pointer relative rounded-xl border-2 p-4 transition-all ${newRoomMode === "Native"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      role="button"
                      aria-pressed={newRoomMode === "Native"}
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <ChatCircleDots
                          className={`h-6 w-6 ${newRoomMode === "Native"
                            ? "text-green-600"
                            : "text-gray-400"
                            }`}
                        />
                        {newRoomMode === "Native" && (
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Native
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Direct Chat
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    You'll be the owner & admin of this room automatically.
                  </span>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCreating) {
                        setShowCreateModal(false);
                        setCreateError(null);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !isConnected || !socket}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                  >
                    {isCreating ? "Creating…" : "Create Room"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-fade-in-scale">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Join Room by ID or Name
                </h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter the Room ID or room name to join the conversation.
              </p>

              <form onSubmit={handleJoinById} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Room ID or Name
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="e.g. Multi_Lingual or 65a1b2c3..."
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>

                {joinError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {joinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining || !joinRoomId.trim()}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                >
                  {isJoining ? "Looking up room..." : "Join Room"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {shareRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setShareRoom(null)}
          />
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-fade-in-scale">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Share "{shareRoom.name}"
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Invite others to join this room
                  </p>
                </div>
                <button
                  onClick={() => setShareRoom(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gray-900 rounded-2xl">
                  <img
                    ref={qrImgRef}
                    src={getQrUrl(shareRoom)}
                    alt={`QR code for ${shareRoom.name}`}
                    className="w-48 h-48 rounded-lg"
                  />
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mb-6">
                Scan this QR code to join the room
              </p>

              <div className="space-y-3">


                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(getRoomLink(shareRoom), "link")
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${copiedField === "link"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${copiedField === "link"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110"
                    }`}>
                    {copiedField === "link" ? (
                      <Check className="h-4 w-4 animate-check-morph" weight="bold" />
                    ) : (
                      <Link2 className="h-4 w-4" weight="regular" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-sm font-medium block ${copiedField === "link" ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"
                      }`}>
                      {copiedField === "link" ? "Copied Link!" : "Copy Room Link"}
                    </span>
                    <span className="text-xs text-gray-400 truncate block max-w-[240px]">
                      {getRoomLink(shareRoom)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(shareRoom._id, "id")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${copiedField === "id"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${copiedField === "id"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110"
                    }`}>
                    {copiedField === "id" ? (
                      <Check className="h-4 w-4 animate-check-morph" weight="bold" />
                    ) : (
                      <QrCode className="h-4 w-4" weight="regular" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-sm font-medium block ${copiedField === "id" ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"
                      }`}>
                      {copiedField === "id" ? "Copied ID!" : "Copy Room ID"}
                    </span>
                    <span className="text-xs text-gray-400 font-mono block">
                      {shareRoom._id}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(shareRoom.name, "name")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${copiedField === "name"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${copiedField === "name"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110"
                    }`}>
                    {copiedField === "name" ? (
                      <Check className="h-4 w-4 animate-check-morph" weight="bold" />
                    ) : (
                      <MessageSquare className="h-4 w-4" weight="regular" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-sm font-medium block ${copiedField === "name" ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"
                      }`}>
                      {copiedField === "name" ? "Copied Name!" : "Copy Room Name"}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      {shareRoom.name}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {
        manageRoom && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => {
                setManageRoom(null);
                setConfirmDelete(false);
                setDeleteError(null);
              }}
            />
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Manage Room
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Update settings for {manageRoom.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setManageRoom(null);
                      setConfirmDelete(false);
                      setDeleteError(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleUpdateMode(manageRoom._id, "Global")}
                      disabled={isUpdating}
                      className={`relative rounded-xl border-2 p-4 transition-all text-left ${manageRoom.mode === "Global"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Translate
                          className={`h-6 w-6 ${manageRoom.mode === "Global"
                            ? "text-indigo-600"
                            : "text-gray-400"
                            }`}
                        />
                        {manageRoom.mode === "Global" && (
                          <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Global
                      </p>
                      <p className="text-xs text-gray-500 mt-1">AI Translation</p>
                    </button>

                    <button
                      onClick={() => handleUpdateMode(manageRoom._id, "Native")}
                      disabled={isUpdating}
                      className={`relative rounded-xl border-2 p-4 transition-all text-left ${manageRoom.mode === "Native"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <ChatCircleDots
                          className={`h-6 w-6 ${manageRoom.mode === "Native"
                            ? "text-green-600"
                            : "text-gray-400"
                            }`}
                        />
                        {manageRoom.mode === "Native" && (
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Native
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Direct Chat</p>
                    </button>
                  </div>
                </div>

                {/* Danger Zone — Delete Room (owner only) */}
                {getUserRole(manageRoom) === "owner" && (
                  <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Danger Zone
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Permanently delete this room and all its messages. This action cannot be undone.
                    </p>

                    {deleteError && (
                      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-3">
                        {deleteError}
                      </div>
                    )}

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full px-4 py-2.5 border border-red-300 dark:border-red-700 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete Room
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Are you sure? This will delete "{manageRoom.name}" and all {manageRoom.members?.length || 0} members' messages.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete(false);
                              setDeleteError(null);
                            }}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(manageRoom._id)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-red-600 rounded-xl text-sm font-medium text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting…" : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default HomePage;
