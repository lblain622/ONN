import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    allowedDevOrigins: ['localhost',"http://localhost","192.168.1.165","172.18.128.1"],
};

export default nextConfig;
