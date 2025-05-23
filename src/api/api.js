import axios from "axios";
import refresh from "./refresh";
import { toast } from "react-toastify";

const url = "https://localhost:7219";
const instance = axios.create({
    baseURL: url,
    headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*'
    },
});

instance.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const accessToken = user?.accessToken;
        if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalConfig = err.config;

        if (originalConfig.url !== "/odata/authentications/login" && err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;

                try {
                    const rs = await refresh.post("/odata/authentications/recreate-token");
                    const accessToken = rs.data.accessToken;
                    const refreshToken = rs.data.refreshToken;
                    let user = JSON.parse(localStorage.getItem("user"));
                    user.accessToken = accessToken;
                    user.refreshToken = refreshToken;
                    localStorage.setItem("user", JSON.stringify(user));

                    return instance(originalConfig);
                } catch (_error) {
                    return Promise.reject(_error);
                }
            }
        }
        return Promise.reject(err);
    }
);

export default instance;
