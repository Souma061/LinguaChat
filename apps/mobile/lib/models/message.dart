import 'package:intl/intl.dart';

class ReplyTo {
  final String msgId;
  final String author;
  final String message;

  ReplyTo({
    required this.msgId,
    required this.author,
    required this.message,
  });

  factory ReplyTo.fromJson(Map<String, dynamic> json) {
    return ReplyTo(
      msgId: json['msgId'] ?? '',
      author: json['author'] ?? '',
      message: json['message'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'msgId': msgId,
      'author': author,
      'message': message,
    };
  }
}

class Message {
  final String msgId;
  final String room;
  final String author; // The author's username
  final String? profilePicture;
  final String original; // The original text of the message
  final Map<String, String> translations;
  final String sourceLocale;
  final Map<String, List<String>> reactions;
  final ReplyTo? replyTo;
  final DateTime? createdAt;
  final String? status; // 'sent', 'failed', 'sending'

  Message({
    required this.msgId,
    required this.room,
    required this.author,
    this.profilePicture,
    required this.original,
    required this.translations,
    required this.sourceLocale,
    required this.reactions,
    this.replyTo,
    this.createdAt,
    this.status,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      msgId: json['msgId'] ?? '',
      room: json['room'] ?? '',
      author: json['author'] ?? '',
      profilePicture: json['profilePicture'],
      original: json['original'] ?? json['message'] ?? '',
      translations: Map<String, String>.from(json['translations'] ?? {}),
      sourceLocale: json['sourceLocale'] ?? 'en',
      reactions: (json['reactions'] as Map<String, dynamic>?)?.map(
            (key, value) => MapEntry(key, List<String>.from(value)),
          ) ?? {},
      replyTo: json['replyTo'] != null ? ReplyTo.fromJson(json['replyTo']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : json['time'] != null ? DateTime.parse(json['time']) : null,
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'msgId': msgId,
      'room': room,
      'author': author,
      'original': original,
      'translations': translations,
      'sourceLocale': sourceLocale,
      'reactions': reactions,
      'replyTo': replyTo?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  String get formattedTime {
    if (createdAt == null) return '';
    return DateFormat('hh:mm a').format(createdAt!);
  }
}
