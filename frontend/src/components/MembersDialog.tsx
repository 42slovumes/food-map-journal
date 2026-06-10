import { Crown, LogOut, Trash2, UserPlus } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { useRealtime } from "@/store/realtime";
import type { Collaborator } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  owner: "擁有者",
  editor: "編輯者",
  viewer: "檢視者",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MembersDialog({ open, onClose }: Props) {
  const user = useAuth((s) => s.user);
  const maps = useData((s) => s.maps);
  const activeMapId = useData((s) => s.activeMapId);
  const members = useData((s) => s.members);
  const loadMembers = useData((s) => s.loadMembers);
  const invite = useData((s) => s.inviteCollaborator);
  const updateRole = useData((s) => s.updateCollaboratorRole);
  const removeMember = useData((s) => s.removeCollaborator);
  const online = useRealtime((s) => s.online);

  const map = maps.find((m) => m.id === activeMapId);
  const isOwner = map?.my_role === "owner";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (open) loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onlineIds = useMemo(() => new Set(online.map((u) => u.id)), [online]);

  async function submitInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      await invite(email.trim(), role);
      toast.success("已邀請成員");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.email ?? err?.response?.data?.detail ?? "邀請失敗");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="成員與共編" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* 邀請（僅 owner） */}
        {isOwner && (
          <form onSubmit={submitInvite} className="rounded-2xl border border-line bg-stone-50 p-3">
            <p className="mb-2 text-sm font-medium text-ink-soft">邀請成員（用 email）</p>
            <div className="flex gap-2">
              <input
                type="email"
                className="input flex-1 py-2.5"
                placeholder="對方的 email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="input w-24 py-2.5"
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              >
                <option value="editor">編輯者</option>
                <option value="viewer">檢視者</option>
              </select>
            </div>
            <button type="submit" disabled={inviting} className="btn-primary mt-2 w-full py-2.5">
              {inviting ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <UserPlus size={16} />}
              邀請
            </button>
            <p className="mt-1.5 text-xs text-ink-faint">對方需先註冊帳號才能被邀請。</p>
          </form>
        )}

        {/* 成員清單 */}
        <div className="space-y-1.5">
          {/* 擁有者 */}
          {map && (
            <MemberRow
              name={map.owner_name}
              sub="擁有者"
              roleLabel={ROLE_LABEL.owner}
              online={onlineIds.has(map.owner)}
              isOwnerRow
            />
          )}
          {members.map((m) => (
            <MemberRow
              key={m.id}
              name={m.display_name + (m.user_id === user?.id ? "（你）" : "")}
              sub={m.email}
              roleLabel={ROLE_LABEL[m.role]}
              online={onlineIds.has(m.user_id)}
              right={
                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <select
                      className="rounded-lg border border-line bg-card px-2 py-1 text-xs"
                      value={m.role}
                      onChange={(e) =>
                        updateRole(m.id, e.target.value as "editor" | "viewer").catch(() =>
                          toast.error("更新失敗"),
                        )
                      }
                    >
                      <option value="editor">編輯者</option>
                      <option value="viewer">檢視者</option>
                    </select>
                  )}
                  {(isOwner || m.user_id === user?.id) && (
                    <button
                      onClick={() => removeRow(m, user?.id === m.user_id, removeMember)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"
                      title={m.user_id === user?.id ? "離開地圖" : "移除"}
                    >
                      {m.user_id === user?.id ? <LogOut size={15} /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </div>

        {members.length === 0 && (
          <p className="py-2 text-center text-sm text-ink-faint">
            還沒有共編成員{isOwner ? "，用上面的 email 邀請朋友一起編輯吧" : ""}。
          </p>
        )}
      </div>
    </Dialog>
  );
}

async function removeRow(
  m: Collaborator,
  isSelf: boolean,
  removeMember: (id: number) => Promise<void>,
) {
  try {
    await removeMember(m.id);
    toast.success(isSelf ? "已離開地圖" : "已移除成員");
  } catch {
    toast.error("操作失敗");
  }
}

function MemberRow({
  name,
  sub,
  roleLabel,
  online,
  right,
  isOwnerRow,
}: {
  name: string;
  sub: string;
  roleLabel: string;
  online: boolean;
  right?: React.ReactNode;
  isOwnerRow?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5">
      <div className="relative">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
          {name.slice(0, 1).toUpperCase()}
        </div>
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-ink">{name}</span>
          {isOwnerRow && <Crown size={14} className="shrink-0 text-amber-500" />}
        </div>
        <p className="truncate text-xs text-ink-faint">{sub}</p>
      </div>
      {right ?? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-ink-soft">
          {roleLabel}
        </span>
      )}
    </div>
  );
}
