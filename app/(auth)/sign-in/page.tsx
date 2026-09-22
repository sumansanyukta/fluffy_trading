'use client';

import {useState} from "react";
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";

const SignIn = () => {
    const [submitted, setSubmitted] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur'
    });

    const onSubmit = async (data: SignInFormData) => {
        console.log('Sign in form submitted (auth not configured):', data);

        await new Promise((resolve) => setTimeout(resolve, 500));

        setSubmitted(true);
    }

    return (
        <>
            <h1 className="form-title">Welcome Back</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@fluffytrading.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email address is required',
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Please enter a valid email address'
                        }
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required' }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Signing In' : 'Sign In'}
                </Button>

                {submitted && (
                    <p className="text-sm text-green-500 mt-4">
                        Thanks! Signed in (demo). Authentication will be wired up here next.
                    </p>
                )}

                <FooterLink text="Don't have an account?" linkText="Sign up" href="/sign-up" />
            </form>
        </>
    )
}
export default SignIn;