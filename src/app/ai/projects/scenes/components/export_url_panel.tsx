// ... existing imports ...
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import instance from "@/lib/axios";

// ... existing code ...

export default function ExportUrlPanel({ open, onClose, project_id, stage_id }: { open: boolean, onClose: () => void, project_id: string, stage_id: string }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [urls, setUrls] = useState<string[]>([]);
  // Example URLs
  
  // Close modal when clicking outside
  useEffect(() => {
    instance.get(`/api/v2/project/get_resource_urls?project_id=${project_id}&stage_id=${stage_id}`).then((res)=>{
        console.log(res)
        setUrls(res)
    })


    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [project_id, stage_id]);

  return (
    
      <div
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
        style={{ zIndex: 1000 }}
      >
        <div
          ref={modalRef}
          className="bg-white p-12 rounded shadow-lg min-w-[800px] relative"
        >
          <label className="block mb-4 font-bold">所有图片，视频，音频和字幕的链接下载(有效期4小时), 请及时下载</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={9}
            value={urls.join('\n')}
            readOnly
            onFocus={ e => e.target.select()}
          />
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => {
              onClose()
            }}
          >
            ×
          </button>
        </div>
      </div>
    
  );
}