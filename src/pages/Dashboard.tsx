import React, { useRef, useState } from "react";

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files).filter(
        (file) => file.type === "application/pdf"
      );
      setFiles((prevFiles) => [...prevFiles, ...fileList]);

      // Reset input to allow re-selection of the same file
      event.target.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fileList = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    setFiles((prevFiles) => [...prevFiles, ...fileList]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-3xl font-semibold mb-0">Dashboard</h1>
      </div>

      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            <div className="col-span-12">
              <div className="nft-promo-card card border-0 rounded-xl overflow-hidden relative z-1 py-6 3xl:px-[76px] 2xl:px-[56px] xl:px-[40px] lg:px-[28px] px-4">
                <img
                  src="/images/gradient-bg.png"
                  className="absolute start-0 top-0 w-full h-full z-[1]"
                  alt=""
                />
                <div className="flex 3xl:gap-[80px] xl:gap-[32px] lg:gap-6 gap-4 items-center relative z-[1]">
                  <div className="sm:block hidden w-full">
                    <img
                      src="/images/ai_image.webp"
                      alt=""
                      className="w-full h-full object-fit-cover"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="mb-4 font-semibold text-3xl text-white">
                      The Smartest Way to Manage Property Repairs
                    </h4>
                    <p className="text-white text-base">
                      Managing property repairs has never been easier. Upload
                      your inspection report, and our AI will instantly extract
                      key issues, saving you time. Active issues will receive
                      competitive bids from verified vendors, schedule on-site
                      assessments, and track progress—all in one place. Take
                      control of your property maintenance with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12">
              <div className="rounded-md bg-white h-full">
                <div className="border-b border-gray-200 px-4 py-3 md:px-6 border-bottom flex items-center flex-wrap gap-2 justify-between">
                  <h6 className="font-bold text-lg mb-0">Listings</h6>
                  <a
                    href="/listings"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View All
                  </a>
                </div>
                <div className="px-6 py-5">
                  <div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-neutral-700 rounded overflow-hidden shadow-4 relative">
                        <div className="rounded-xl overflow-hidden">
                          <img
                            src="/images/house_example.jpg"
                            alt=""
                            className="w-full h-[250px] object-fit-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/40 via-black/60 to-transparent py-3 px-2">
                          <h6 className="text-base font-bold text-white mb-3">
                            161 old pennywell road
                          </h6>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="badge text-sm font-semibold bg-blue-500 px-4 py-1.5 rounded text-white flex items-center gap-2"
                            >
                              plumbing
                              <span className="badge text-neutral-900 dark:text-neutral-900 bg-white w-5 h-5 flex items-center justify-center rounded text-xs">
                                4
                              </span>
                            </button>
                            <button
                              type="button"
                              className="badge text-sm font-semibold bg-blue-500 px-4 py-1.5 rounded text-white flex items-center gap-2"
                            >
                              electrical
                              <span className="badge text-neutral-900 dark:text-neutral-900 bg-white w-5 h-5 flex items-center justify-center rounded text-xs">
                                2
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-neutral-700 rounded overflow-hidden shadow-4 flex">
                        {/* Drag & Drop Area */}
                        <div
                          className="border-2 h-[250px] w-full border-dashed border-gray-400 p-6 rounded-lg flex flex-col items-center justify-center text-center gap-3 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents bubbling to parent
                            fileInputRef.current?.click();
                          }}
                        >
                          <p className="text-gray-500 font-semibold">
                            Drag & Drop your PDF files here
                          </p>
                          <span className="text-gray-400">or</span>
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents opening twice
                              fileInputRef.current?.click();
                            }}
                          >
                            Choose File
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="application/pdf"
                            multiple
                            onChange={handleFileChange}
                          />
                        </div>

                        {/* File Preview List */}
                        {files.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-gray-700 font-semibold mb-2">
                              Uploaded Files:
                            </h3>
                            <ul className="space-y-2">
                              {files.map((file, index) => (
                                <li
                                  key={index}
                                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                                >
                                  <span className="text-gray-700">
                                    {file.name}
                                  </span>
                                  <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
