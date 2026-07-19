import { Sparkles, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { getMoodRecommendations } from "../api/client";
import BookCard from "../components/BookCard";
import { useStore } from "../context/StoreContext";


const questions = [
  ["genre", "What genre do you enjoy?", "Fantasy, programming, business, romance..."],
  ["mood", "What mood are you looking for?", "Happy, relaxing, motivated..."],
  ["level", "What is your reading level?", "Beginner / Intermediate / Advanced"],
  ["audience", "Who is the book for?", "Myself, child, student, professional"],
  ["topics", "What topics interest you?", "AI, finance, history, psychology"],
  ["budget", "What is your budget?", "Example: under $20"],
  ["favorites", "Which books or authors do you already like?", "Harry Potter, Atomic Habits..."],
  ["type", "Do you prefer fiction or non-fiction?", "fiction / non-fiction"],
  ["length", "Do you want a short or long book?", "short / long"],
];


export default function MoodPage(){ 
  const { books } = useStore();
  const [form,setForm] = useState({});
  const [description,setDescription] = useState("");
  const [loading,setLoading] = useState(false);
  const [results,setResults] = useState([]);
  const [summary,setSummary] = useState("");



const recommend = async () => {

  setLoading(true);

  try {

    const payload = {

      mood: form.mood || "",

      description: description || "",

      genre: form.genre || "",

      reading_level: form.level || "",

      audience: form.audience || "",

      topic: form.topics || "",

      budget: form.budget || "",

      favorite_books: form.favorites || "",

      fiction_type: form.type || "",

      length: form.length || "",

      limit: 4

    };


    console.log("Sending AI:", payload);


    const response = await getMoodRecommendations(payload);


    console.log("AI Response:", response);


    setResults(response.recommendations || []);

    setSummary(response.summary || "");


  } catch(error){

    console.error("AI Error:", error);

  }


  finally{

    setLoading(false);

  }

};


return (

<div>


<section className="
border-b 
border-stone-200
bg-[radial-gradient(circle_at_center,_#edf2e8,_transparent_55%),linear-gradient(135deg,_#faf7f1,_#f3eee5)]
">

<div className="container-shell py-16 text-center">


<Sparkles 
className="mx-auto text-forest-600"
size={32}
/>


<h1 className="
mt-4 
text-4xl 
font-extrabold
">

AI Book Recommendation Assistant

</h1>


<p className="
mx-auto
mt-4
max-w-xl
text-stone-600
">

Tell me what kind of book you are looking for, and I will recommend books for you.

</p>


</div>

</section>





<section className="container-shell py-12">


<div className="section-card rounded-2xl p-6">



<div className="grid gap-4 md:grid-cols-3">


{
questions.map(
([key,title,placeholder])=>(


<label 
key={key}
className="text-sm font-semibold"
>


{title}


<input

className="
mt-2
w-full
rounded-lg
border
p-3
font-normal
"


placeholder={placeholder}


value={
form[key] || ""
}


onChange={
(e)=>
setForm({

...form,

[key]:
e.target.value

})

}


/>


</label>


))

}



</div>





<textarea

className="
mt-6
w-full
rounded-lg
border
p-4
"


rows="4"


placeholder="
Example:
Recommend a beginner-friendly programming book.
I want a romantic story with a happy ending.
"


value={description}


onChange={
(e)=>
setDescription(
e.target.value
)
}


/>





<button

onClick={recommend}


className="
mt-5
rounded-xl
bg-forest-600
px-6
py-3
text-white
"


>


{

loading ?

<LoaderCircle 
className="animate-spin"
/>

:

"Get AI Recommendations"

}


</button>



</div>





{
summary &&

<p className="
mt-8
text-lg
font-semibold
">

{summary}

</p>

}





<div className="
mt-6
grid
gap-6
sm:grid-cols-2
lg:grid-cols-3
">


{results.map((item)=>{

 const book = books.find(
   (b)=>b.id === item.book_id
 );

 if(!book) return null;

 return (
   <BookCard
      key={book.id}
      book={book}
   />
 )

})}


</div>



</section>


</div>

);


}