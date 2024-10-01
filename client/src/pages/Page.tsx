import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

interface User {
    exp: number;
    iat: number;
    password: string;
    sub: string;
    userFingerprint: string;
    username: string;
}

const Page = () => {
    const [user, setUser] = useState<User>();
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(200);

    const fetchCSRFToken = async () => {
        const res = await fetch('http://localhost:3000/csrf-token', {
            method: 'GET',
            credentials: 'include'  // Send cookies with the request
        });
        const data = await res.json();
        localStorage.setItem('csrfToken', data.csrfToken);
    };

    const fetchApi = async () => {
        try {
            const res = await fetch("http://localhost:3000/protected", {
                method: 'GET', // Specify the HTTP method
                headers: {
                    'Content-Type': 'application/json', // Set content type
                },
                credentials: 'include', // Include cookies in the request
            });

            if (!res.ok) {
                // Throw error
                throw res
            }
            // Fetch the response
            const result = await res.json();
            setUser(result.user);
            console.log(result)
        } catch (error: any) {
            setError(true)
            setStatus(error.status)
        }
    }

    const ErrorMessage = () => {
        if (status == 403) {
            return <section className='h-screen flex flex-col items-center justify-center'>
                <h1 className='text-4xl font-bold mb-4'>Error 403: Forbidden</h1>
                <h1 className='text-md font-bold mb-4'>You can't access this page</h1>
                <Link to={"/"} className='py-3 px-4 rounded-lg bg-white text-black'>Go to login</Link>
            </section>
        }
        else if (status == 401) {
            return <section className='h-screen flex flex-col items-center justify-center'>
                <h1 className='text-4xl font-bold mb-4'>Error 401: Unauthorized</h1>
                <h1 className='text-md font-bold mb-4'>You are not authorized</h1>
                <Link to={"/"} className='py-3 px-4 rounded-lg bg-white text-black'>Go to login</Link>
            </section>
        }
        else {
            return <section className='h-screen flex flex-col items-center justify-center'>
                <h1 className='text-4xl font-bold mb-4'>Error 500: Internal Server Error</h1>
                <h1 className='text-md font-bold mb-4'>Something went wrong.</h1>
                <Link to={"/"} className='py-3 px-4 rounded-lg bg-white text-black'>Go to login</Link>
            </section>
        }
    }

    useEffect(() => {
        fetchApi()
        // fetchCSRFToken();
    }, [])

    return (
        <>
            {!error ? (
                <section className='h-screen flex flex-col items-center justify-center'>
                    <h1 className='text-4xl font-bold mb-6'>Hello there, {user?.username}</h1>
                    <h1 className='text-2xl font-semibold'>Id: {user?.sub}</h1>
                    <h1 className='text-2xl font-semibold'>Username: {user?.username}</h1>
                    <h1 className='text-2xl font-semibold'>Password: {user?.password}</h1>
                    <h1 className='text-md'><span className='font-bold'>Fingerprint:</span> {user?.userFingerprint}</h1>
                    <h1 className='text-md mb-6'>Your token will expire in 15 mins</h1>
                    <div className='flex-row space-x-8'>
                        <Link to={"/"} className=' py-2 px-4 rounded-lg bg-white font-medium text-black'>Go to login</Link>
                        <button onClick={fetchApi} className='py-2 px-4 rounded-lg bg-white font-medium text-black'>Fetch again</button>
                    </div>
                </section>
            ) : (
                <ErrorMessage />
            )}
        </>
    )
}

export default Page