class Room {
  final String id;
  final String name;
  final String? description;
  final String owner;
  final List<String> admins;
  final List<String> members;
  final bool isPublic;
  final String mode; // 'Global' or 'Native'
  final DateTime? createdAt;

  Room({
    required this.id,
    required this.name,
    this.description,
    required this.owner,
    required this.admins,
    required this.members,
    required this.isPublic,
    required this.mode,
    this.createdAt,
  });

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      owner: json['owner'] is Map ? (json['owner']['_id'] ?? '') : (json['owner'] ?? ''),
      admins: List<String>.from(json['admins']?.map((x) => x is Map ? x['_id'] : x) ?? []),
      members: List<String>.from(json['members']?.map((x) => x is Map ? x['_id'] : x) ?? []),
      isPublic: json['isPublic'] ?? true,
      mode: json['mode'] ?? 'Global',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'owner': owner,
      'admins': admins,
      'members': members,
      'isPublic': isPublic,
      'mode': mode,
    };
  }
}
