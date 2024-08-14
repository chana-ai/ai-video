
const USER_ID = "userId";
const CREDENTIALS = "credentials";

export const setUserId = (userId: string) =>{
    localStorage.setItem(USER_ID, userId);
}

export const getUserId = () => {
    return localStorage.getItem(USER_ID)
}

export const getCredentials = ()=>{
    return localStorage.getItem(CREDENTIALS);
}

export const setCredentials = (credential: string) =>{
    localStorage.setItem(CREDENTIALS, credential);
}
