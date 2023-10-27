function wrap_choices_debug_in_html(choices, category, exemplar){
    txt = `
        <img class="left_choice" src=${choices[0]}></img>
        <img class="right_choice" src=${choices[1]}></img>
        <p>
            cat: ${category} <br> ex: ${exemplar}
        </p>
    `
    return txt
}

function wrap_choices_in_html(choices){
    txt = `
        <img class="left_choice" src=${choices[0]}></img>
        <img class="right_choice" src=${choices[1]}></img>
    `
    return txt
}

function wrap_stim_in_html(stimulus){
    txt = `<img class="stim" src=${stimulus}></img>`

    return txt
}

function wrap_wrong_feedback_in_html(stimulus, category){
    txt = (category == 1) ?
        `<img class="left_stim" src=${stimulus}></img>`: 
        `<img class="right_stim" src=${stimulus}></img>`

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

const DEBUG_MODE = true
var is_time_out = false;
const time_experiment = 0.5; // minutes
const T_exp = time_experiment * 60 * 1000; // ms 
const N_stim_packs = 2;
const N_exemplars = 129;

var jsPsych = initJsPsych({
    on_finish: function() {
        jatos.endStudy(jsPsych.data.get().json());
        //jatos.endStudy(jsPsych.data.get().json());
        //jatos.endStudy(jsPsych.data.get().json());
    }
})

var timeline = [];

setTimeout(
    function(){
        jsPsych.endExperiment("The experiment has concluded.");
    }, 
    T_exp
);

var timeline = []; 

var pack_ID = jsPsych.randomization.sampleWithoutReplacement(range(1, N_stim_packs), 1)[0]
var stim_path = "./stimuli/" ;

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
  stimulus: "Welcome to the dotCategoryLearn experiment! Press any key to continue.",
  data: {task: 'welcome'}
};
timeline.push(welcome)

var instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p>You will be shown a collection of dots. Each set of dots will belong to one of two categories: category A or category B.<br>You will not know in advance which category the given set of dots belongs to.</br></p><p>When you are shown a set of dots, categorize them into category A (left arrow key) or category B (right arrow key)</br>as quickly as possible.</p><p>If your choice was correct, you will see the feedback \"Correct!\"<br>If your choice was incorrect, you will see the dots displayed in the category they actually belong in.</br></p><p>Your goal is to categorize as many sets of dots correctly as possible.</p><p>Press any key to begin.</p>",
  data: {task: 'introduction'}
};
timeline.push(instructions)

var fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: "NO_KEYS",
    trial_duration: 350,
    data: {task: 'fixation'}
};

var test_stim = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return wrap_stim_in_html(jsPsych.timelineVariable('stimulus'))
    },
    choices: "NO_KEYS",
    trial_duration: 1000,
    post_trial_gap : 1000,
    data: {task : 'stimulus'}
};

var choice_stimuli = [stim_path + "A.png", stim_path + "B.png"]

var test_choices = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function (){
        return DEBUG_MODE ? 
        wrap_choices_debug_in_html(choice_stimuli, jsPsych.timelineVariable('category'), jsPsych.timelineVariable('exemplar')) :
        wrap_choices_in_html(choice_stimuli)
    },
    choices: ['ArrowLeft', 'ArrowRight'],
    data: {
        task: 'response',
        stimulus: jsPsych.timelineVariable('stimulus'),
        correct_response: jsPsych.timelineVariable('correct_response'),
        exemplar_ID: jsPsych.timelineVariable('exemplar'),
        category: jsPsych.timelineVariable('category')
    },
    on_finish: function(data){
        data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
    }
};

var feedback = {
    type: jsPsychHtmlKeyboardResponse,
    trial_duration: 1000,
    stimulus: function(){
        const last_trial = jsPsych.data.get().last(1).values()[0];
        if(last_trial.correct){
            return `<p> <font color="green" size="4vw"> Correct category! </font> <br> <br> <font color="green" size="7vw"> +10 points </font> </p>`;
        } else {
            //return `<p> <font size="4vw"> Wrong category! </font> <br> <br> <font color="red" size="7vw"> -10 points </font> </p>`;
            return `<p> <font color="red" size="4vw"> Wrong category! </font> </p>`;
        }
    },
    data: {task: 'feedback'}
};

var trials = {
    timeline : [fixation, test_stim, test_choices, feedback],
    timeline_variables : stimuli,
    randomize_order : true
};
timeline.push(trials)

jatos.onLoad(() => {
  jsPsych.run(timeline);
});
