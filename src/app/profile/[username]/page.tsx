import Feed from "@/components/feed/Feed";
import LeftMenu from "@/components/leftMenu/LeftMenu";
import RightMenu from "@/components/rightMenu/RightMenu";
import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { notFound } from "next/navigation";

// Define the types for the props passed to the ProfilePage component
interface ProfilePageParams {
  username: string;
}

interface ProfilePageProps {
  params: ProfilePageParams;
}

// Profile page component
const ProfilePage = async ({ params }: ProfilePageProps) => {
  // Destructure the username from params
  const { username } = params;

  // Fetch the user from the database based on the username
  const user = await prisma.user.findFirst({
    where: {
      username: username,
    },
    include: {
      _count: {
        select: {
          followers: true,
          followings: true,
          posts: true,
        },
      },
    },
  });

  // If no user is found, return a "not found" page
  if (!user) return notFound();

  // Get the current user's ID from Clerk authentication
  const { userId: currentUserId } = await auth();

  let isBlocked = false;

  // If the current user is authenticated, check if they are blocked by the profile user
  if (currentUserId) {
    const blockStatus = await prisma.block.findFirst({
      where: {
        blockerId: user.id,
        blockedId: currentUserId,
      },
    });

    if (blockStatus) isBlocked = true;
  }

  // If the current user is blocked, return a "not found" page
  if (isBlocked) return notFound();

  return (
    <div className="flex gap-6 pt-6">
      {/* Left menu - hidden on smaller screens */}
      <div className="hidden xl:block w-[20%]">
        <LeftMenu type="profile" />
      </div>

      {/* Main profile content */}
      <div className="w-full lg:w-[70%] xl:w-[50%]">
        <div className="flex flex-col gap-6">
          {/* Profile header */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-64 relative">
              <Image
                src={user.cover || "/noCover.png"}
                alt="Cover Image"
                fill
                className="rounded-md object-cover"
              />
              <Image
                src={user.avatar || "/noAvatar.png"}
                alt="User Avatar"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full absolute left-0 right-0 m-auto -bottom-16 ring-4 ring-white object-cover"
              />
            </div>

            <h1 className="mt-20 mb-4 text-2xl font-medium">
              {user.name && user.surname
                ? `${user.name} ${user.surname}`
                : user.username}
            </h1>

            {/* Stats: Posts, Followers, Following */}
            <div className="flex items-center justify-center gap-12 mb-4">
              <div className="flex flex-col items-center">
                <span className="font-medium">{user._count.posts}</span>
                <span className="text-sm">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-medium">{user._count.followers}</span>
                <span className="text-sm">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-medium">{user._count.followings}</span>
                <span className="text-sm">Following</span>
              </div>
            </div>
          </div>

          {/* Feed component with user-specific posts */}
          <Feed username={user.username} />
        </div>
      </div>

      {/* Right menu */}
      <div className="hidden lg:block w-[30%]">
        <RightMenu user={user} />
      </div>
    </div>
  );
};

export default ProfilePage;
