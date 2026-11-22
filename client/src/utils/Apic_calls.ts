
import { API_URL } from '@/lib/api';
import axios from "axios";
const RegistUser = async (formdata: FormData) => {
  try {
    const response = await axios.post(`${API_URL}/api/user`, formdata,{
      withCredentials:true
    } );


    return response.data;
  } catch (error: any) {
    let status = error?.response?.status;
    if (status === 400) {
      
      return "User already exists";
    } else {
      return "Server error";
    }
  }
};

export {RegistUser}