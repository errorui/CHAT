
import axios from "axios";
const RegistUser = async (formdata: FormData) => {
  try {
    const response = await axios.post(`/api/user`, formdata,{
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