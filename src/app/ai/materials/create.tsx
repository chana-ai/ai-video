import React, { useState } from 'react';

export default function CreateMaterial() {
  const [files, setFiles] = useState([]); // 存储文件列表
  const [tags, setTags] = useState(''); // 存储标签
  const [theme, setTheme] = useState(''); // 存储主题

  // 处理文件添加
  const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files).slice(0, 5 - files.length);
      const newFiles = files.concat(selectedFiles);
      if (newFiles.length > 5) {
        alert('最多只能上传5个文件。');
        return;
      }
      setFiles(newFiles);
  };

  // 处理文件删除
  const handleFileRemove = (index) => {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);
  };

  // 处理标签输入
  const handleTagsChange = (e) => {
     setTags(e.target.value);
  };

  // 处理主题选择
  const handleThemeChange = (e) => {
     setTheme(e.target.value);
  };

  // 处理上传逻辑
  const handleUpload = () => {
    // 这里可以添加上传文件的逻辑
    console.log('上传文件：', files);
    console.log('标签：', tags);
    console.log('主题：', theme);
    // 实际的上传代码会在这里
    alert('上传逻辑将在这里实现。');
  };

  // 取消上传，清空文件、标签和主题
  const handleCancel = () => {
    setFiles([]);
    setTags('');
    setTheme('');
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*,video/*" // 只接受图片和视频文件
        onChange={handleFileChange}
      />
      {files.length > 0 && (
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              {file.name}
              <button onClick={() => handleFileRemove(index)}>删除</button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <label>标签:
          <input type="text" value={tags} onChange={handleTagsChange} />
        </label>
      </div>
      <div>
        <label>主题:
          <input type="text" value={theme} onChange={handleThemeChange} />
        </label>
      </div>
      <button onClick={handleUpload}>上传</button>
      <button onClick={handleCancel}>取消</button>
    </div>
  );
};

