import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { mobileConfig } from '../config/mobileConfig';

export const RoomScreen = ({ route, navigation }: any) => {
  const { roomId, roomName } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let newSocket: Socket;

    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      
      newSocket = io(mobileConfig.socketUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join_Room', { room: roomId, lang: 'en' }); // default to english
      });

      newSocket.on('room_history', (history: any[]) => {
        setMessages(history.reverse()); // Reverse if we are rendering inverse or pushing to end
      });

      newSocket.on('receive_message', (msg: any) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });

      newSocket.on('translations_ready', (update: any) => {
        setMessages((prev) => prev.map((msg) => {
           if (msg.msgId === update.msgId) {
              return { ...msg, translations: { ...msg.translations, [update.lang]: update.text } };
           }
           return msg;
        }));
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (newSocket) {
        newSocket.emit('leave_room', { room: roomId });
        newSocket.disconnect();
      }
    };
  }, [roomId]);

  const handleSend = () => {
    if (!inputText.trim() || !socket) return;
    
    socket.emit('send_message', {
      room: roomId,
      text: inputText.trim(),
    });
    
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?.username === user?.username;
    
    // Attempt to show translated text, fallback to original
    const displayLang = 'en'; // Hardcoded target lang for now, could be dynamic
    const hasTranslation = item.translations && item.translations[displayLang];
    const textToShow = hasTranslation ? item.translations[displayLang] : item.original;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.sender?.username?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          {!isMe && <Text style={styles.senderName}>{item.sender?.username}</Text>}
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {textToShow}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{roomName || 'Chat Room'}</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.msgId || item._id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#f8fafc',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
