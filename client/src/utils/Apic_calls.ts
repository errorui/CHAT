
import axios from "axios";
const API_URL = 'http://localhost:5000';
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