function wrap_choices_debug_in_html(choices, category, exemplar, score){
    txt = `
        ${wrap_score_in_html(score)}
        <img class="left_choice" src=${choices[0]}></img>
        <img class="right_choice" src=${choices[1]}></img>
        <p>
            cat: ${category} <br> ex: ${exemplar}
        </p>
    `;
    return txt
}

function wrap_choices_in_html(choices, score){
    txt = `
        ${wrap_score_in_html(score)}
        <img class="left_choice" src=${choices[0]}></img>
        <img class="right_choice" src=${choices[1]}></img>
    `;
    return txt
}

function wrap_stim_in_html(stimulus, score){
    txt = `
        ${wrap_score_in_html(score)}
        <img class="stim" src=${stimulus}></img>
    `;
    return txt
}

function wrap_score_in_html(score){
    txt = `
        <div style="text-align: center; position: fixed; top: 5vh; left: 40vw;">
            <div style="margin:0 auto; width: 20vw; top: 8vh; font-size: 1vw"> 
                Current score : <font color="green"> ${score} points </font>
            </div>
        </div>
    `;
    return txt
}

function wrap_wrong_feedback_in_html(stimulus, category){
    txt = (category == 1) ?
        `<img class="left_stim" src=${stimulus}></img>`: 
        `<img class="right_stim" src=${stimulus}></img>
    `;
    return txt
}

function* range_iter(start, end) {
    for (let i = start; i <= end; i++) {
        yield i;
    }
}

function range(start, end) {
    return Array.from(range_iter(start, end))
}

function exemplar_stimulus(idx, stim_path, pack_ID, category){
    return {
        stimulus: `${stim_path}/pack_${pack_ID}/cat_${category}/ex_${category}_${idx}.png`, 
        correct_response: (category == 1) ? `ArrowLeft` : `ArrowRight`,
        exemplar: idx,
        category: category,
    };
}

function exemplar_stimuli(indices, stim_path, pack_ID, category){
    return Array.from(
        indices, 
        (idx) => (exemplar_stimulus(idx, stim_path, pack_ID, category))
    );
}

function rand_in_range(minVal,maxVal)
{
  var randVal = minVal+(Math.random()*(maxVal-minVal));
  return Math.round(randVal);
}

const IS_DEBUG = false
const IS_ONLINE = false
const time_experiment = 10; // minutes
const T_exp = time_experiment * 60 * 1000; // ms 
const N_exemplars = 100;

var is_time_out = false;
var score = 0;

var timeline = []; 

var pack_ID = "easy"
var stim_path = "./stimuli/" ;

if (IS_ONLINE){
    var jsPsych = initJsPsych({
        on_finish: function() {
            jatos.endStudy(jsPsych.data.get().csv());
        }
    })
    var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
    var study_id = jsPsych.data.getURLVariable('STUDY_ID');
    var session_id = jsPsych.data.getURLVariable('SESSION_ID');

    jsPsych.data.addProperties({
        subject_id: subject_id,
        study_id: study_id,
        session_id: session_id
    });
}else{
    ID = rand_in_range(1001, 9999)

    var jsPsych = initJsPsych({
        on_finish: function() {
            jsPsych.data.get().localSave('csv',`results_${ID}.csv`);
        }
    })
}

setTimeout(
    function(){
        jsPsych.endExperiment(`<p> The experiment has concluded. <br> Thank you for participating! </p>`);
    }, 
    T_exp
);

const stimuli_cat_1 = exemplar_stimuli(range(1, N_exemplars), stim_path, pack_ID, 1);
const stimuli_cat_2 = exemplar_stimuli(range(1, N_exemplars), stim_path, pack_ID, 2);
const stimuli = stimuli_cat_1.concat(stimuli_cat_2);

var preload = {
    type: jsPsychPreload,
    images: function(){
        stimuli.map(x => x.stimulus)
    }
};
timeline.push(preload);

var welcome = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "Welcome to the Category Learning experiment! Press any key to continue.",
  data: {task: 'welcome'}
};
timeline.push(welcome)

var instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>You will be shown images and each image will contain a set of black dots. Each image will belong to one of two categories: category A or category B.
            <br>You will not know in advance which category the given collection of dots belongs to.</p>
            <p>After you see an image you will be asked to categorize it into <b>category A (by pressing the left arrow key)</b> or <b>category B (by pressing the right arrow key)</b>
            as quickly as possible.</p>
            <p>After you make a choice you will receive feedback telling you whether you matched the image to the correct category or not.</p>
            <p>Your goal is to categorize as many sets of dots correctly as possible.</p>
            <p>Press any key to begin.</p>`,
  data: {task: 'introduction'}
};
timeline.push(instructions)

var ITI = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return `
            ${wrap_score_in_html(score)}
            <div style="font-size:60px;">+</div>
        `
    },
    choices: "NO_KEYS",
    trial_duration: 350,
    data: {task: 'ITI'}
};

var test_stim = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return wrap_stim_in_html(jsPsych.timelineVariable('stimulus'), score)
    },
    choices: "NO_KEYS",
    trial_duration: 1000,
    data: {task : 'stimulus'}
};

var blank = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return `${wrap_score_in_html(score)}`
    },
    choices: "NO_KEYS",
    trial_duration: 1000,
};

var choice_stimuli = [stim_path + "A.png", stim_path + "B.png"]

var test_choices = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return IS_DEBUG ? 
        wrap_choices_debug_in_html(choice_stimuli, jsPsych.timelineVariable('category'), jsPsych.timelineVariable('exemplar'), score) :
        wrap_choices_in_html(choice_stimuli, score)
    },
    choices: ['ArrowLeft', 'ArrowRight'],
    data: {
        task: 'response',
        stimulus: jsPsych.timelineVariable('stimulus'),
        correct_response: jsPsych.timelineVariable('correct_response'),
        exemplar_ID: jsPsych.timelineVariable('exemplar'),
        category: jsPsych.timelineVariable('category')
    },
    trial_duration: 4000,
    on_finish: function(data){
        data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
    }
};

var feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1500,
    stimulus: function(){
        const last_trial = jsPsych.data.get().last(1).values()[0];
        if (last_trial.response) {
            if(last_trial.correct){
                score += 10;
                return `<p> <font color="green" size="4vw"> Correct category! </font> <br> <br> <font color="green" size="7vw"> +10 points </font> </p>`;
            } else {
                //return `<p> <font size="4vw"> Wrong category! </font> <br> <br> <font color="red" size="7vw"> -10 points </font> </p>`;
                return `<p> <font color="red" size="4vw"> Wrong category! </font> </p>`;
            }
        } else {
            return `<p> <font color="red" size="5vw"> Time out! </font> <br> Please try to respond as quickly as possible. </p>`
        }
    },
    data: {task: 'feedback'}
};

var trials = {
    timeline : [ITI, test_stim, blank, test_choices, feedback],
    timeline_variables : stimuli,
    randomize_order : true
};
timeline.push(trials)

if (IS_ONLINE){
    jatos.onLoad(() => {jsPsych.run(timeline);});
}else{
    jsPsych.run(timeline);
}
