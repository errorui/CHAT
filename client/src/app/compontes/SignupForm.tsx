import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = 'http://localhost:5000';

const postuser = async (formData: FormData) => {
  try {
    const response = await axios.post(`${API_URL}/api/user`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 400) {
      return "User already exists";
    } else {
      return "Server error";
    }
  }
};

// Define the type for form values
type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmpassword: string;
  ProfilePic: File | null;
};

const SignupForm = () => {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>({
    name: '',
    email: '',
    password: '',
    confirmpassword: '',
    ProfilePic: null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setFormValues({
      ...formValues,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formValues.password !== formValues.confirmpassword) {
      alert("Passwords don't match");
      return;
    }

    const formData = new FormData();
    formData.append('name', formValues.name);
    formData.append('email', formValues.email);
    formData.append('password', formValues.password);
    formData.append('confirmpassword', formValues.confirmpassword);
    if (formValues.ProfilePic) {
      formData.append('ProfilePic', formValues.ProfilePic);
    }

    const result = await postuser(formData);

    if (result === "User already exists") {
      alert("User already exists. Try different email.");
    } else {
      alert("User created successfully!");
      router.push('/chats');
    }
  };

  return (
    <Card className="p-5">
      <h1 className="text-3xl text-center p-3 uppercase">Signup</h1>
      <form onSubmit={handleSubmit} className="w-full" encType="multipart/form-data">
        <div className="space-y-4">
          <div>
            <label htmlFor="name">Name</label>
            <Input
              id="name"
              name="name"
              placeholder="Name"
              value={formValues.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              placeholder="Email"
              value={formValues.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={formValues.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmpassword">Confirm Password</label>
            <Input
              type="password"
              id="confirmpassword"
              name="confirmpassword"
              placeholder="Confirm Password"
              value={formValues.confirmpassword}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="ProfilePic">Profile Picture</label>
            <Input
              type="file"
              id="ProfilePic"
              name="ProfilePic"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
        </div>
        <Button className="w-full mt-8" type="submit">
          Sign Up
        </Button>
      </form>
    </Card>
  );
};

export default SignupForm;
