import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Paperclip, Trash, Download } from "lucide-react"

interface FileItem {
  id: number
  filename: string
  uploaded_at: string
  storage_key: string
}

export default function DeliveryFiles({ deliveryId }: { deliveryId: number }) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)

  const loadFiles = async () => {
    try {
      const data = await api.getDeliveryFiles(deliveryId)
      setFiles(data)
    } catch (error) {
      console.error("Failed to load files:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    try {
      const filesArray = Array.from(selectedFiles)
      await api.uploadDeliveryFiles(deliveryId, filesArray)
      await loadFiles()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const blob = await api.downloadDeliveryFile(deliveryId, fileId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!confirm("Delete this file?")) return
    try {
      await api.deleteDeliveryFile(deliveryId, fileId)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [deliveryId])

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Label
            htmlFor="file_delivery"
            className="flex flex-1 items-center justify-center cursor-pointer space-x-2 px-4 py-2 border  rounded-md bg-primary text-primary-foreground hover:bg-primary/90  transition-colors duration-200"
            >
            <Paperclip className="h-5 w-5 text-white" />
            <span className="font-medium">Attach files</span>
        </Label>


        <Input
          id="file_delivery"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:shadow-md transition-shadow duration-200"
            >
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => handleDownload(file.id, file.filename)}
              >
                <Download className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 hover:underline">
                  {file.filename}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 cursor-pointer"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
