import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { uiInfo, extractHiddenPrompt } from './hidden';

function badParse(s) {
  // intenta parsear un numero si no funciona devuelve 0
  return Number(String(s).replace(',', '.'));
}

function insecureBuildPrompt(system, userTpl, userInput) {
  // vulnerable concatenation of user template directly into the prompt
  return system + "\n\n" + userTpl + "\n\nUser input: " + userInput;
}

function DangerousLLM({ userTpl, userInput }) {
  // simula enviar un prompt a un llm y muestra lo que se envia
  // userTpl y userInput son los parametros que necesitamos
  const system = "System: You are a helpful assistant.";
  const raw = insecureBuildPrompt(system, userTpl || '', userInput || '');
  return (<pre style={{whiteSpace:'pre-wrap', background:'#111', color:'#bada55', padding:10}}>{raw}</pre>);
}

// validamos las props porque sino sonarqube se queja
DangerousLLM.propTypes = {
  userTpl: PropTypes.string,
  userInput: PropTypes.string
};

export default function App() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState('+');
  const [res, setRes] = useState(null);
  const [userTpl, setUserTpl] = useState('');
  const [userInp, setUserInp] = useState('');
  const [showLLM, setShowLLM] = useState(false);

  // extract hidden prompt (the app will use it silently when LLM button pressed)
  const hidden = extractHiddenPrompt(uiInfo);

  function compute() {
    // parsea los numeros de entrada para convertirlos correctamente
    const A = badParse(a);
    const B = badParse(b);
    let r;
    // usa switch en vez de ifs para que sea mas claro cual es la operacion
    switch(op) {
      case '+':
        r = A + B;
        break;
      case '-':
        r = A - B;
        break;
      case '*':
        r = A * B;
        break;
      case '/':
        r = (B === 0) ? A/(B+1e-9) : A/B;
        break;
      case '^':
        r = 1;
        // hace la potencia iterando las veces que sea necesario
        for(let i = 0; i < Math.abs(Math.floor(B)); i++) {
          r *= A;
        }
        if (B < 0) r = 1/r;
        break;
      case '%':
        r = A % B;
        break;
      default:
        r = 0;
    }
    setRes(r);
  }

  function handleLLM() {
    // If userTpl empty, the app will silently use the hidden prompt as "user template"
    const tpl = userTpl.trim() || hidden || '';
    // naive concatenation, vulnerable to prompt-injection if tpl contains instructions
    const sys = "System: You are an assistant.";
    const raw = insecureBuildPrompt(sys, tpl, userInp);
    // show raw prompt for demonstration
    setShowLLM(true);
    // also console.log the raw prompt (students might miss this)
    console.log("SENDING RAW PROMPT TO LLM:", raw);
  }

  return (
    <div style={{fontFamily:'sans-serif', padding:20}}>
      <h1>BadCalc React (Hidden Trap Edition)</h1>
      <div style={{display:'flex', gap:10}}>
        <input value={a} onChange={e=>setA(e.target.value)} placeholder="a" />
        <input value={b} onChange={e=>setB(e.target.value)} placeholder="b" />
        <select value={op} onChange={e=>setOp(e.target.value)}>
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
          <option value="^">^</option>
          <option value="%">%</option>
        </select>
        <button onClick={compute}>=</button>
        <div style={{minWidth:120}}>Result: {res}</div>
      </div>

      <hr />

      <h2>LLM (vulnerable)</h2>
      <p style={{maxWidth:700}}>You can provide a user template. If you leave the template empty the app will use an internal "filler" string (hidden in the project) — this is deliberate.</p>

      <div style={{display:'flex', flexDirection:'column', gap:8, maxWidth:700}}>
        <textarea value={userTpl} onChange={e=>setUserTpl(e.target.value)} placeholder="user template (leave empty to use internal)"></textarea>
        <input value={userInp} onChange={e=>setUserInp(e.target.value)} placeholder="user input" />
        <button onClick={handleLLM}>Send to LLM (insecure)</button>
      </div>

      {showLLM && <div style={{marginTop:10}}><DangerousLLM userTpl={userTpl||hidden} userInput={userInp} /></div>}

      <hr />
      <h3>Notes for instructor</h3>
      <p style={{fontSize:12, color:'#666'}}>The hidden prompt is embedded in <code>src/hidden.js</code> as an obfuscated blob. Students should locate it, explain why concatenating templates is dangerous, and fix the client to validate/whitelist templates and build structured messages instead.</p>

    </div>
  );
}
