const BASE_URL = import.meta.env.VITE_API_URL || "";


/*
 Demo database for GitHub Pages
 This stores subjects while the website is running
*/

let demoSubjects = [
  {
    id: 1,
    name: "Artificial Intelligence",
    color: "#F2B84B"
  },
  {
    id: 2,
    name: "Full Stack Development",
    color: "#60A5FA"
  },
  {
    id: 3,
    name: "Data Structures",
    color: "#4ADE80"
  }
];



async function request(path, options = {}) {


  /*
    GitHub Pages does not have backend,
    so use local demo mode
  */

  if (!BASE_URL) {


    // GET ALL SUBJECTS
    if (
      path === "/subjects" &&
      !options.method
    ) {
      return demoSubjects;
    }



    // ADD ANY SUBJECT
    if (
      path === "/subjects" &&
      options.method === "POST"
    ) {

      const data = JSON.parse(options.body);


      const newSubject = {

        id: Date.now(),

        // user entered name
        name: data.name,

        // selected color
        color: data.color

      };


      demoSubjects.push(newSubject);


      return newSubject;
    }




    // UPDATE SUBJECT

    if (
      path.startsWith("/subjects/") &&
      options.method === "PUT"
    ) {


      const id = Number(
        path.split("/")[2]
      );


      const data = JSON.parse(options.body);



      demoSubjects =
        demoSubjects.map((subject)=>{


          if(subject.id === id){

            return {

              ...subject,

              name:data.name,

              color:data.color

            };

          }


          return subject;

        });



      return demoSubjects.find(
        s=>s.id===id
      );

    }




    // DELETE SUBJECT

    if(
      path.startsWith("/subjects/") &&
      options.method==="DELETE"
    ){


      const id = Number(
        path.split("/")[2]
      );


      demoSubjects =
        demoSubjects.filter(
          s=>s.id!==id
        );


      return null;

    }




    // other pages demo response

    if(path.includes("/assignments")){
      return [];
    }


    if(path.includes("/exams")){
      return [];
    }


    if(path.includes("/timetable")){
      return [];
    }


    if(path.includes("/recommendations")){
      return {
        mode:"demo",
        summary:
        "Keep studying consistently and complete your tasks.",
        subjects:[]
      };
    }



    if(path.includes("/timer")){
      return {
        totalSeconds:0
      };
    }



    return [];

  }




  // REAL BACKEND MODE

  const response = await fetch(
    `${BASE_URL}/api${path}`,
    {
      headers:{
        "Content-Type":"application/json"
      },

      ...options
    }
  );



  if(!response.ok){

    throw new Error(
      `Request failed (${response.status})`
    );

  }



  if(response.status===204){

    return null;

  }



  return response.json();

}




export const api = {


  get:(path)=>
    request(path),



  post:(path,data)=>
    request(
      path,
      {
        method:"POST",
        body:JSON.stringify(data)
      }
    ),



  put:(path,data)=>
    request(
      path,
      {
        method:"PUT",
        body:JSON.stringify(data)
      }
    ),



  del:(path)=>
    request(
      path,
      {
        method:"DELETE"
      }
    )

};