"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  UserPlus,
  User,
  X,
  Settings,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { mockUsers, mockGroups } from "@/lib/mockData";
import { Group, User as UserType } from "@/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // Current user mock
  const currentUser = mockUsers[0];

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: newGroupName,
      members: [currentUser],
      createdBy: currentUser.id,
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setShowCreateModal(false);
  };

  const handleInviteUser = () => {
    if (!inviteEmail.trim() || !currentGroupId) return;

    // In a real app, this would send an invitation to the user's email
    // For the prototype, we'll simulate adding a new user
    const mockInvitedUser: UserType = {
      id: `u${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
    };

    const updatedGroups = groups.map((group) => {
      if (group.id === currentGroupId) {
        return {
          ...group,
          members: [...group.members, mockInvitedUser],
        };
      }
      return group;
    });

    setGroups(updatedGroups);
    setInviteEmail("");
    setShowInviteModal(false);
    setCurrentGroupId(null);
  };

  const openInviteModal = (groupId: string) => {
    setCurrentGroupId(groupId);
    setShowInviteModal(true);
  };

  const removeMember = (groupId: string, userId: string) => {
    const updatedGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.filter((member) => member.id !== userId),
        };
      }
      return group;
    });

    setGroups(updatedGroups);
  };

  return (
    <main className="pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center">
            <Users className="h-6 w-6 text-primary-600 mr-2" />
            グループ
          </h1>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            グループ作成
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-neutral-600 mb-4">グループがありません</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              グループを作成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-neutral-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-neutral-800">
                      {group.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openInviteModal(group.id)}
                        className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title="メンバーを招待"
                      >
                        <UserPlus className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/map?group=${group.id}`}
                        className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title="グループのマップを表示"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/groups/${group.id}/settings`}
                        className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title="グループ設定"
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    {group.members.length}人のメンバー
                  </p>
                </div>

                <div className="p-5">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">
                    メンバー
                  </h4>
                  <ul className="space-y-3">
                    {group.members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-800">
                              {member.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {group.createdBy === currentUser.id &&
                          member.id !== currentUser.id && (
                            <button
                              onClick={() => removeMember(group.id, member.id)}
                              className="p-1 text-neutral-400 hover:text-red-500"
                              title="メンバーを削除"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                        {member.id === group.createdBy && (
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            作成者
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-neutral-900">
                新しいグループを作成
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                グループ名
              </label>
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例：友達とのお出かけ"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-neutral-900">
                メンバーを招待
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                メールアドレス
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="example@email.com"
              />
              <p className="mt-2 text-xs text-neutral-500">
                招待されたユーザーにはメールで通知が送信されます。
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleInviteUser}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
              >
                招待
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
