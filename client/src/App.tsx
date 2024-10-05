
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "./components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters",
  })
})


function App() {
  const navigate = useNavigate()
  const [csrfToken, setCsrfToken] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values)
    try {
      const res = await fetch("http://localhost:3000/user", {
        method: 'POST', // Specify the HTTP method
        headers: {
          'Content-Type': 'application/json', // Set content type
          'x-csrf-token': csrfToken
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(values), // Send the form data as JSON
      });
      if (!res.ok) {
        throw new Error(`Response status: ${res.status}`)
      }
      const result = await res.json();
      navigate("/page") // navigate to the page
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const fetchCSRFToken = async () => {
      const res = await fetch('http://localhost:3000/test', {
        method: 'GET',
        credentials: 'include'  // Send cookies with the request
      });
      const data = await res.json();
      localStorage.setItem('csrfToken', data.csrfToken);
      setCsrfToken(data.csrfToken)
    };

    fetchCSRFToken();
  }, [])

  return (
    <>
      <section className="h-svh flex justify-center items-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-7 rounded-lg w-96 border border-white">
            <h1 className="text-center font-bold text-xl">Welcome</h1>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mr-4">Login</Button>
            <Link to={"/page"} className='py-2 px-4 rounded-lg bg-white font-medium text-black'>Go to page</Link>
          </form>
        </Form>
      </section>

    </>
  )
}

export default App
