import { signOut } from "@/app/(auth)/actions";
import { buttonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 md:order-last">
      <span className="hidden max-w-48 truncate text-sm text-slate-600 sm:block">{user.email}</span>
      <form action={signOut}>
        <button type="submit" className={buttonClass("secondary", "px-3 py-1.5")}>
          Sign out
        </button>
      </form>
    </div>
  );
}
