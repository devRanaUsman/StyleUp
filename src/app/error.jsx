"use client";
export default function ErrorPage({reset}){return <div className="container page"><h1>Something went wrong</h1><p>Please try loading this page again.</p><button className="btn btn--primary" onClick={reset}>Try again</button></div>;}
