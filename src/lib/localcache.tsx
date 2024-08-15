
const USER_ID = "userId";
const CREDENTIALS = "credentials";
const PHONE = "phone";

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

export const setPhone = (phone: string)=>{
    localStorage.setItem(PHONE, phone);
}
export const getPhone = () =>{
    return localStorage.getItem(PHONE);
}