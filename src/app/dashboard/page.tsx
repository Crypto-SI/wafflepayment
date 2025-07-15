"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, SlidersHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { AuthService } from "@/lib/supabase/auth-service-client";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuthGuard();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [pictureSuccess, setPictureSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUserData();
    }
  }, [isAuthenticated, authLoading]);

  const loadUserData = async () => {
    try {
      const result = await AuthService.getCurrentUser();
      if (result.success) {
        setUserData({
          auth: result.user,
          subscriber: result.subscriber
        });
        
        // Initialize form with current data
        setProfileForm({
          name: result.subscriber?.full_name || result.subscriber?.name || result.user?.email || '',
          email: result.subscriber?.email || result.user?.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const result = await AuthService.updateProfile({
        name: profileForm.name,
        email: profileForm.email
      });
      
      if (result.success) {
        // Reload user data to reflect changes
        await loadUserData();
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Profile picture upload handler
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPictureFile(e.target.files[0]);
      setPictureError(null);
      setPictureSuccess(null);
    }
  };

  const handlePictureUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setPictureUploading(true);
    setPictureError(null);
    setPictureSuccess(null);
    try {
      if (!pictureFile) {
        setPictureError("Please select a file to upload.");
        setPictureUploading(false);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(pictureFile.type)) {
        setPictureError("Only PNG, JPEG, JPG, or WEBP images are allowed.");
        setPictureUploading(false);
        return;
      }

      // Validate file size (10MB limit)
      if (pictureFile.size > 10485760) {
        setPictureError("File size must be less than 10MB.");
        setPictureUploading(false);
        return;
      }

      // Get user id
      const userId = userData?.subscriber?.user_id || userData?.auth?.id;
      if (!userId) {
        setPictureError("User not found.");
        setPictureUploading(false);
        return;
      }

      // Create a unique filename
      const ext = pictureFile.name.split('.').pop();
      const filePath = `${userId}/avatar.${ext}`;

      // Upload to Supabase Storage with explicit content type
      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(filePath, pictureFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: pictureFile.type, // Explicitly set content type
        });

      if (uploadError) {
        setPictureError("Upload failed: " + uploadError.message);
        setPictureUploading(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        setPictureError("Failed to get public URL for uploaded image.");
        setPictureUploading(false);
        return;
      }

      // Update avatar_url in DB
      const result = await AuthService.updateProfile({ avatarUrl: publicUrl });
      if (result.success) {
        setPictureSuccess("Profile picture updated!");
        await loadUserData();
      } else {
        setPictureError("Failed to update profile: " + (result.error || 'Unknown error'));
      }
    } catch (err: any) {
      setPictureError("Unexpected error: " + (err.message || err.toString()));
    } finally {
      setPictureUploading(false);
      setPictureFile(null);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !userData) {
    return null;
  }

  const user = {
    name: userData.subscriber?.full_name || userData.subscriber?.name || userData.auth?.email || 'Wallet User',
    email: userData.subscriber?.email || userData.auth?.email || '',
    avatarUrl: userData.subscriber?.avatar_url || 'https://placehold.co/128x128.png',
    credits: userData.subscriber?.credits || 0,
    isSubscriber: userData.subscriber?.subscription_tier === 'premium' || false,
    needsProfile: userData.needsProfile || false,
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">My Dashboard</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Welcome back, {user.name.split(' ')[0]}.</p>
        
        {user.needsProfile && (
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Profile Setup Needed</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your wallet authentication was successful, but your profile setup is incomplete. Some features may be limited until your profile is fully configured.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <div className="mx-auto grid max-w-4xl items-start gap-8">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar person" />
              <AvatarFallback className="text-3xl">{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Credits Remaining</p>
                  <p className="text-4xl font-bold tracking-tight">{user.credits.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 text-center flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-muted-foreground">Subscription Status</p>
                  {user.isSubscriber ? (
                    <Badge className="mt-2 px-4 py-2 text-base font-semibold" variant="secondary">
                      <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-500" />
                      CryptoWaffle Subscriber
                    </Badge>
                  ) : (
                    <p className="text-2xl font-bold tracking-tight text-muted-foreground">Inactive</p>
                  )}
                </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg">
                <Link href="/top-up">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Top Up Credits
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <SlidersHorizontal className="mr-2 h-5 w-5" />
                Manage Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={isProfileOpen} className="w-full">
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Profile Management</CardTitle>
                <CardDescription>Update your account settings and manage your subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <form className="space-y-4" onSubmit={handleProfileUpdate}>
                  <h3 className="font-headline text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
                
                <Separator />

                <form className="space-y-4" onSubmit={handlePictureUpload}>
                    <h3 className="font-headline text-lg font-semibold">Profile Picture</h3>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar person" />
                            <AvatarFallback>{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="picture">Update picture</Label>
                            <Input id="picture" type="file" accept="image/*" onChange={handlePictureChange} disabled={pictureUploading} />
                        </div>
                    </div>
                    <Button type="submit" disabled={pictureUploading || !pictureFile}>
                      {pictureUploading ? 'Uploading...' : 'Update Picture'}
                    </Button>
                    {pictureError && <div className="text-red-500 text-sm">{pictureError}</div>}
                    {pictureSuccess && <div className="text-green-600 text-sm">{pictureSuccess}</div>}
                </form>
                
                <Separator />
                
                <form className="space-y-4">
                   <h3 className="font-headline text-lg font-semibold">Change Password</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                    </div>
                  <Button>Update Password</Button>
                </form>

                <Separator />

                <div>
                  <h3 className="font-headline text-lg font-semibold">Subscription</h3>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4 mt-4">
                    <div>
                      <p className="font-medium">Current Plan</p>
                      <p className="text-muted-foreground">{user.isSubscriber ? 'CryptoWaffle Subscriber' : 'No active subscription'}</p>
                    </div>
                    <Button variant="outline">Manage Subscription</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
