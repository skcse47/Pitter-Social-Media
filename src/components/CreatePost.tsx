"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon, SmilePlus } from "lucide-react";
import { Button } from "./ui/button";
import { CreateNewPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data"; 
import ImageUpload from "./ImageUpload";

function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);


  const handleSubmit = async () => {
    setIsPosting(true);
    if (content.trim() || imageUrl) {
      try {
        let uploadedImageUrl = imageUrl;
        // Upload to AWS S3 if an image is selected
        if (imageFile) {
          const formData = new FormData();
          formData.append("file", imageFile);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const { url } = await res.json();
          uploadedImageUrl = url;
        }
        
        const post = await CreateNewPost(content, uploadedImageUrl);
        if (post.success) {
          setContent("");
          setImageUrl("");
          setShowImageUpload(false);
          toast.success("Post created successfully");
        }
      } catch (error) {
        toast.error("Failed to create post");
      } finally {
        setIsPosting(false);
      }
    }
  };

  const addEmoji = (emoji: any) => {
    setContent((prev) => prev + emoji.native);
    // setShowEmojiPicker(false); // Close picker after selecting emoji
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target as Node) &&
      emojiButtonRef.current &&
      !emojiButtonRef.current.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card className="mb-6 relative">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>

          {/* Emoji Picker (Will be positioned correctly) */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute top-full left-4 z-50 bg-white border shadow-md rounded-md"
            >
              <Picker
                data={data}
                onEmojiSelect={addEmoji}
                theme="light"
                perRow={6}
                emojiSize={22}
              />
            </div>
          )}

          {showImageUpload && (
              <ImageUpload
              file={imageFile}
              setFile={setImageFile}
              previewUrl={imageUrl}
              setPreviewUrl={setImageUrl}
            />
          )}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              {/* Emoji Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                }}
                ref={emojiButtonRef} //Attach ref to button
                disabled={isPosting}
              >
                <SmilePlus className="size-4 transition-colors duration-200 hover:text-[#f6d32d]" />
                
              </Button>

              {/* Photo Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                <ImageIcon className="size-4" />
                Photo
              </Button>
            </div>

            {/* Post Button */}
            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreatePost;
