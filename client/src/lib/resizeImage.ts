const AVATAR_SIZE = 256;

// centre crop and shrink, phone photos are several MB
export async function toAvatarFile(file: File): Promise<File> {
  try {
    const image = await createImageBitmap(file);
    const side = Math.min(image.width, image.height);
    const size = Math.min(AVATAR_SIZE, side);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return file;

    // jpeg has no transparency
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
    image.close();

    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.88));
    return blob ? new File([blob], "avatar.jpg", { type: "image/jpeg" }) : file;
  } catch {
    // not decodable here, the server explains what is accepted
    return file;
  }
}
