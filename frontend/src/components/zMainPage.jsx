// import React, { useState, useEffect } from "react";
// import { Helmet } from "react-helmet";
// import UserInfoTabs from "./UserForm/UserInfoTabs";

// // Format phone number utility
// const formatPhoneNumber = (phone) => {
//   const digits = phone.replace(/\D/g, "");
//   return digits.length === 10
//     ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
//     : phone;
// };

// const AUTO_CLEAR = false;

// const MainPage = () => {
//   const [formData, setFormData] = useState({
//     type: "resume",

//     // Shared Contact Info
//     firstName: "",
//     lastName: "",
//     suffix: "",
//     credentials: "",
//     email: "",
//     phone: "",
//     address: "",
//     address2: "",
//     city: "",
//     state: "",
//     zip: "",

//     // Resume-specific
//     education: [
//       {
//         school: "",
//         degree: "",
//         major: "",
//         gradYear: "",
//       },
//     ],
//     experienceList: [
//       {
//         company: "",
//         position: "",
//         start: "",
//         end: "",
//         location: "",
//         bullets: [""],
//       },
//     ],
//     skills: [""],
//     certifications: [""],
//     hobbies: [""],

//     // Cover letter-specific
//     recipientName: "",
//     companyName: "",
//     companyLocation: "",
//     job_title: "",
//     experience: "",
//     job_description: "",
//   });

//   const [previewText, setPreviewText] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [hasPaid, setHasPaid] = useState(false);
//   const [sendEmail, setSendEmail] = useState(true);
//   const [signoffTone, setSignoffTone] = useState("default");

//   const setFormType = (type) => {
//     setFormData((prev) => ({ ...prev, type }));
//   };

//   useEffect(() => {
//     if (AUTO_CLEAR) {
//       localStorage.removeItem("resumeContent");
//       setPreviewText("");
//     } else {
//       const saved = localStorage.getItem("resumeContent");
//       if (saved) setPreviewText(saved);
//     }
//   }, []);

//   const handleSetPreview = (text) => {
//     setPreviewText(text);
//     localStorage.setItem("resumeContent", text);
//   };

//   const handleGenerate = async (finalFormData) => {
//     setUserEmail(finalFormData.email);
//     try {
//       console.log("📤 Submitting formData:", finalFormData);

//       const response = await fetch(
//         `${process.env.REACT_APP_API_BASE_URL}/generate/`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ...finalFormData, signoffTone }),
//         }
//       );

//       const result = await response.json();
//       const generated = result.output || result.generated_text || result.text;

//       const finalOutput = generated || "Error: No meaningful content generated";

//       handleSetPreview(finalOutput);
//       console.log("✅ Raw result:", result);
//       console.log("✅ Stringified:", JSON.stringify(result));
//     } catch (err) {
//       handleSetPreview("Error: Could not generate preview");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <Helmet>
//         <title>Healthcare Resume Builder – AI for Nurses & Medical Staff</title>
//         <meta
//           name="description"
//           content="Generate ATS-friendly healthcare resumes and cover letters using AI. Designed for nurses, medical assistants, and clinical staff applying to hospitals and clinics."
//         />
//         <meta
//           name="keywords"
//           content="healthcare resume, nurse resume, AI resume generator, ATS resume, medical assistant resume, hospital job resume"
//         />
//         <link rel="canonical" href="https://healthcareresumebuilder.com/" />
//         <meta
//           property="og:title"
//           content="Healthcare Resume Builder – AI for Nurses & Medical Staff"
//         />
//         <meta
//           property="og:description"
//           content="Create ATS-friendly healthcare resumes using AI. Designed for nurses and clinical professionals."
//         />
//         <meta
//           property="og:url"
//           content="https://healthcareresumebuilder.com/"
//         />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary" />
//         <script type="application/ld+json">
//           {`
//             {
//               "@context": "https://schema.org",
//               "@type": "WebApplication",
//               "name": "Healthcare Resume Builder",
//               "url": "https://healthcareresumebuilder.com",
//               "description": "AI-powered resume and cover letter builder for nurses, clinical staff, and healthcare professionals.",
//               "applicationCategory": "BusinessApplication",
//               "operatingSystem": "All",
//               "offers": {
//                 "@type": "Offer",
//                 "price": "5.00",
//                 "priceCurrency": "USD"
//               }
//             }
//           `}
//         </script>
//       </Helmet>

//       <h1 style={styles.heading}>
//         AI Resume Builder for Nurses, Medical Assistants, and Clinic Staff
//       </h1>
//       <p style={styles.paragraph}>
//         Create ATS-optimized healthcare resumes and cover letters in seconds.
//         Whether you're applying as a nurse, medical assistant, receptionist, or
//         clinic administrator, our AI helps you generate professional documents
//         tailored for hospital and clinic jobs.
//       </p>
//       <ul style={styles.list}>
//         <li>
//           ✅ Built for healthcare job seekers — nurses, CNAs, techs, and
//           administrative staff
//         </li>
//         <li>
//           ✅ AI-generated resumes and cover letters optimized for clinical and
//           medical roles
//         </li>
//         <li>
//           ✅ Uses healthcare keywords and ATS-friendly formatting to get past
//           job filters
//         </li>
//         <li>
//           ✅ Instantly export your resume or letter as a Word document — no
//           account required
//         </li>
//       </ul>
//       <div
//         style={{
//           background: "linear-gradient(90deg, #9be7ff, #e3f2fd)",
//           color: "#0d47a1",
//           fontWeight: 600,
//           fontSize: "1.1rem",
//           padding: "0.75rem 1.5rem",
//           borderRadius: "999px",
//           textAlign: "center",
//           margin: "2rem auto 1rem",
//           maxWidth: "fit-content",
//           boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
//         }}
//       >
//         Generate Your Resume or Cover Letter
//       </div>

//       <section style={styles.section}>
//         {/* <h2>Generate Resume or Cover Letter</h2> */}
//         <UserInfoTabs
//           formData={formData}
//           setFormData={setFormData}
//           signoffTone={signoffTone}
//           setSignoffTone={setSignoffTone}
//           setPreviewText={setPreviewText}
//           onGenerate={handleGenerate}
//           setFormType={setFormType}
//         />
//       </section>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     padding: "2rem",
//     fontFamily: "Arial, sans-serif",
//     maxWidth: "700px",
//     margin: "0 auto",
//     display: "flex",
//     flexDirection: "column",
//     gap: "2rem",
//   },
//   heading: {
//     fontSize: "2rem",
//     marginBottom: "1rem",
//   },
//   paragraph: {
//     fontSize: "1rem",
//     lineHeight: "1.6",
//   },
//   list: {
//     paddingLeft: "1.5rem",
//     lineHeight: "1.6",
//   },
//   section: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "1.5rem",
//   },
// };

// export default MainPage;
