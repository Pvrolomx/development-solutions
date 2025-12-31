import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/clients/:path*",
    "/properties/:path*",
    "/api/clients/:path*",
    "/api/properties/:path*",
    "/api/contacts/:path*",
    "/api/documents/:path*",
    "/api/photos/:path*",
  ],
};
