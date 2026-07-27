import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu } from 'lucide-react';

import { api } from '../api/client.js';

import {
  EmptyState,
  StatCard,
  SubjectPill,
  Badge,
  formatDate
} from '../components/ui.jsx';


const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];


function todayIndex() {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}


function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();

  now.setHours(0,0,0,0);

  return Math.round(
    (target - now) / 86400000
  );
}


export default function Dashboard() {

  const [state, setState] = useState(null);
  const [error, setError] = useState('');


  useEffect(() => {
    load();
  }, []);



  async function load() {

    try {

      const [
        today,
        assignments,
        exams,
        timetable,
        recommendations

      ] = await Promise.all([

        api.get('/timer/today'),

        api.get('/assignments?status=pending'),

        api.get('/exams'),

        api.get('/timetable'),

        api.get('/recommendations')

      ]);


      setState({

        today,
        assignments,
        exams,
        timetable,
        recommendations

      });


    } catch(err){

      setError(err.message);

    }

  }



  if(error){

    return (

      <div className="error-text">

        {error}

      </div>

    );

  }



  if(!state){

    return <div>Loading...</div>;

  }



  const day = todayIndex();



  const todaysBlocks =
    state.timetable.filter(
      (b)=> b.day_of_week === day
    );



  const upcomingExam =
    state.exams.find(
      (e)=> daysUntil(e.exam_date)>=0
    );



  const topSubject =
    state.recommendations?.subjects?.[0];



  return (

    <div>


      <header className="page-header">

        <div>

          <h1>
            Welcome back 👋
          </h1>

          <p>
            Here's where things stand for {DAY_NAMES[day]}.
          </p>

        </div>

      </header>



      <div className="grid grid-4 mb-16">


        <StatCard

          label="Studied today"

          value={
            formatMinutes(
              state.today?.totalSeconds || 0
            )
          }

        />



        <StatCard

          label="Pending assignments"

          value={
            state.assignments.length
          }

          accent="coral"

        />



        <StatCard

          label={
            upcomingExam
            ? upcomingExam.subject_name
            : "Next exam"
          }


          value={
            upcomingExam
            ? `${daysUntil(upcomingExam.exam_date)}d`
            : "—"
          }

          accent="gold"

        />



        <StatCard

          label="Subjects tracked"

          value={
            state.timetable.length || 3
          }

          accent="blue"

        />


      </div>





      <div className="grid grid-2">


        <div className="card">


          <div className="section-title">

            Today's Schedule

          </div>



          {
            todaysBlocks.length === 0

            ?

            <EmptyState>

              No schedule today.
              Visit timetable to create your plan.

            </EmptyState>


            :

            <div className="list">

            {
              todaysBlocks.map((b)=>(

                <div
                  key={b.id}
                  className="row-card"
                >

                  <SubjectPill

                    name={b.subject_name}

                    color={b.subject_color}

                  />


                  <span>

                    {b.start_time} -
                    {b.end_time}

                  </span>


                </div>

              ))

            }

            </div>

          }


        </div>





        <div className="card">


          <div className="section-title">

            Upcoming Assignments

          </div>



          {
            state.assignments.length===0

            ?

            <EmptyState>

              No pending assignments 🎉

            </EmptyState>


            :

            <div className="list">


            {
              state.assignments
              .slice(0,5)
              .map((a)=>(


                <div
                  className="row-card"
                  key={a.id}
                >

                  <div>


                    <h4>

                      {a.title}

                    </h4>


                    <small>

                      Due {formatDate(a.due_date)}

                    </small>


                  </div>


                  <SubjectPill

                    name={a.subject_name}

                    color={a.subject_color}

                  />


                </div>


              ))

            }


            </div>


          }


        </div>


      </div>





      <div className="card mt-16">


        <div className="mode-banner">


          {
            state.recommendations.mode === "claude"

            ?

            <Badge variant="gold">

              <Cpu size={12}/>

              AI Powered

            </Badge>


            :

            <Badge variant="muted">

              <Sparkles size={12}/>

              Smart Recommendation

            </Badge>

          }



        </div>



        <p className="text-soft">

          {
            state.recommendations.summary
          }

        </p>



        {
          topSubject &&

          <p>

            Top priority:

            <strong>

              {topSubject.subject}

            </strong>

          </p>

        }



        <Link

          to="/insights"

          className="btn btn-ghost btn-sm"

        >

          View AI Insights

          <ArrowRight size={14}/>


        </Link>


      </div>



    </div>

  );

}




function formatMinutes(totalSeconds){

  const mins =
    Math.round(totalSeconds/60);


  if(mins < 60)

    return `${mins}m`;



  const h =
    Math.floor(mins/60);


  const m =
    mins%60;


  return `${h}h ${m}m`;

}