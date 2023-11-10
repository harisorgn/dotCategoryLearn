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
const IS_ONLINE = true
const time_experiment = 10; // minutes
const T_exp = time_experiment * 60 * 1000; // ms 
const N_exemplars = 100;
const N_practice_trials = 10;

var is_time_out = false;
var score = 0;

var timeline = []; 

var pack_ID = "1"
var stim_path = "./stimuli/" ;

if (IS_ONLINE){
    var jsPsych = initJsPsych({
        on_finish: function() {
            jatos.endStudy(jsPsych.data.get().csv());
        }
    })
    jatos.onLoad(function(){
        var subj_id = jatos.urlQueryParameters.PROLIFIC_PID
        var std_id = jatos.urlQueryParameters.STUDY_ID
        var sess_id = jatos.urlQueryParameters.SESSION_ID

        jsPsych.data.addProperties({
            subject_id: subj_id,
            study_id: std_id,
            session_id: sess_id
        });
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

const r = range(1, N_exemplars);

const idx_cat_1_training = jsPsych.randomization.sampleWithoutReplacement(r, Math.floor(N_practice_trials/2));
const idx_cat_1_test = r.filter(x => !idx_cat_1_training.includes(x));
const stimuli_cat_1_training = exemplar_stimuli(idx_cat_1_training, stim_path, pack_ID, 1);
const stimuli_cat_1_test = exemplar_stimuli(idx_cat_1_test, stim_path, pack_ID, 1);

const idx_cat_2_training = jsPsych.randomization.sampleWithoutReplacement(r, Math.floor(N_practice_trials/2));
const idx_cat_2_test = r.filter(x => !idx_cat_2_training.includes(x));
const stimuli_cat_2_training = exemplar_stimuli(idx_cat_2_training, stim_path, pack_ID, 2);
const stimuli_cat_2_test = exemplar_stimuli(idx_cat_2_test, stim_path, pack_ID, 2);

const stimuli_training = stimuli_cat_1_training.concat(stimuli_cat_2_training);
const stimuli_test = stimuli_cat_1_test.concat(stimuli_cat_2_test);

var choice_stimuli = [stim_path + "A.png", stim_path + "B.png"]

var preload = {
    type: jsPsychPreload,
    images: function(){
        stimuli = stimuli_test.concat(stimuli_training)
        s = stimuli.map(x => x.stimulus)
        s.concat(choice_stimuli)
    }
};
timeline.push(preload);

var welcome = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "Welcome to the Category Learning experiment! Press any key to continue.",
  data: {task: 'welcome'}
};
timeline.push(welcome)

var intro_1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
            <p>You will be shown images of patterns of black dots.  Some are category A, some are category B.
            <br>You will not know in advance which category a specific pattern belongs to.</p>
            <p>After you see an image, you will be asked to guess its category <b>(left arrow for category A, right arrow for category B)</b></p>
            <p>Try to guess the category correctly, but also try to make the correct guess as quickly as you can. </p>
            <p>After you choose, the screen will show you what the correct category was.</p>
            <p><b>You will receive a bonus payment up to $2 depending on your accuracy!</b>
            <p>Press any key to continue.</p>
            `,
  data: {task: 'introduction_1'}
};
timeline.push(intro_1)

var intro_2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
            <p> <b>The first 10 trials are a practice round that will not count towards your score and bonus payment.</b></p>
            <p> You will be notified when practice finishes and the test begins. </p>
            <p> Press any key to begin the practice round.</p>
            `,
    data: {task: 'introduction_2'}
  };
timeline.push(intro_2)

var ITI = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return `
            ${wrap_score_in_html(score)}
            <div> Please press any button to continue to the next trial.</div>
        `
    },
    data: {task: 'ITI'}
};

var test_stim = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return wrap_stim_in_html(jsPsych.timelineVariable('stimulus'), score)
    },
    choices: "NO_KEYS",
    trial_duration: 600,
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

var feedback_training = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1500,
    stimulus: function(){
        const last_trial = jsPsych.data.get().last(1).values()[0];
        if (last_trial.response) {
            if(last_trial.correct){
                return `<p> <font color="green" size="4vw"> Correct category! </font> </p>`;
            } else {
                return `<p> <font color="red" size="4vw"> Wrong category! </font> </p>`;
            }
        } else {
            return `<p> <font color="red" size="5vw"> Time out! </font> <br> Please try to respond as quickly as possible. </p>`
        }
    },
    data: {task: 'feedback'}
};

var trials_training = {
    timeline : [ITI, test_stim, blank, test_choices, feedback_training],
    timeline_variables : stimuli_training,
    randomize_order : true
};
timeline.push(trials_training)

var intermission = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
            <b> <p> The practice round has finished. For the rest of the experiment you will receive points for every correct answer.</p>
            <p> You will receive a bonus payment up to $2 according to your points after the end of the experiment. </p> </b>
            <p> Press any key to begin the test. </p>
            `,
    data: {task: 'intermission'}
  };
timeline.push(intermission)

var trials = {
    timeline : [ITI, test_stim, blank, test_choices, feedback],
    timeline_variables : stimuli_test,
    randomize_order : true
};
timeline.push(trials)

if (IS_ONLINE){
    jatos.onLoad(() => {jsPsych.run(timeline);});
}else{
    jsPsych.run(timeline);
}
