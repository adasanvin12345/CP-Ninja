const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const Blog = require('./models/blog')
const Fb = require('./models/feedback')
const fs = require('fs')
const { readFile } = require('fs/promises')
const keyword_extractor = require('keyword-extractor')
const { last, lte } = require('lodash')
const e = require('express')
var porterStemmer = require('@stdlib/nlp-porter-stemmer')
// const SpellCheck = require('@caijs/spellcheck')
var spelling = require('spelling'),
  dictionary = require('spelling/dictionaries/en_US.js')
var dict = new spelling(dictionary)

// making the constants folder and making TFIDF array

// function cleaner(pss) {
//   let punctuationless = pss.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
//   pss = punctuationless.replace(/\s{2,}/g, ' ')
//   pss = pss.replace(/\d+/g, '')
//   pss = pss.replace(/\s+/g, ' ').trim()
//   pss = pss.replace(',', ' ')
//   pss = pss.replace(/[^\w\s]/g, '').toLowerCase()
//   // console.log(pss)
//   return pss
// }
// let sw = fs.readFileSync(__dirname + '/dataset/sw.txt', {
//   encoding: 'utf-8',
// })
// sw = sw.toString()
// sw = sw.split('\r\n')

// const row_kw = []
// const all_keywords = new Set()
// for (let i = 1; i <= 1450; i++) {
//   let ps = fs.readFileSync(
//     __dirname + '/dataset/ps/ps_' + i.toString() + '.txt',
//     {
//       encoding: 'utf-8',
//     }
//   )
//   ps = ps.toString()
//   let finalps = cleaner(ps)
//   let cur_keywords = []
//   finalps = finalps.split('input')[0]
//   finalps = finalps.split('\n')
//   finalps = finalps.join(' ')
//   finalps = finalps.split(' ')
//   for (let i = 0; i < finalps.length; i++) {
//     if (
//       sw.indexOf(finalps[i]) == -1 &&
//       finalps[i] != ' ' &&
//       finalps[i] != '' &&
//       finalps[i].substr(0, 4) != 'http'
//     )
//       cur_keywords.push(finalps[i])
//   }
//   for (let i = 0; i < cur_keywords.length; i++) {
//     cur_keywords[i] = natural.PorterStemmer.stem(cur_keywords[i])
//     if (dict.search(cur_keywords[i])[0] != undefined)
//       cur_keywords[i] = dict.search(cur_keywords[i])[0].word
//   }
//   row_kw.push(cur_keywords)
//   for (let j = 0; j < cur_keywords.length; j++) {
//     all_keywords.add(cur_keywords[j])
//   }
// }
// const final_kw = [...all_keywords]

// function log(base, number) {
//   return Math.log(number) / Math.log(base)
// }
// console.log(1450 * final_kw.length)
// let tf = []
// for (let i = 0; i < 1450; i++) {
//   let curtf = []
//   for (let j = 0; j < final_kw.length; j++) {
//     curtf.push(0)
//   }
//   for (let j = 0; j < row_kw[i].length; j++) {
//     curtf[final_kw.indexOf(row_kw[i][j])] += 1
//   }
//   tf.push(curtf)
// }
// idf = []
// for (let j = 0; j < final_kw.length; j++) {
//   idf.push(0)
// }
// for (let i = 0; i < 1450; i++) {
//   for (let j = 0; j < final_kw.length; j++) {
//     if (tf[i][j] > 0) idf[j] += 1
//   }
// }
// for (let j = 0; j < final_kw.length; j++) {
//   idf[j] = 1 + Math.log(1450 / idf[j])
// }
// tfidf = []
// for (let i = 0; i < 1450; i++) {
//   tfidf.push(tf[i])
//   for (let j = 0; j < final_kw.length; j++) {
//     tfidf[i][j] = tfidf[i][j] * idf[j]
//     tfidf[i][j] = tfidf[i][j] / row_kw[i].length
//   }
// }
// tfidf_string = ''
// for (let i = 0; i < 1450; i++) {
//   for (let j = 0; j < final_kw.length; j++) {
//     tfidf_string += tfidf[i][j].toString() + '\n'
//   }
// }
// idf_string = ''
// for (let j = 0; j < final_kw.length; j++) {
//   idf_string += idf[j].toString() + '\n'
// }
// keywords_string = ''
// for (let j = 0; j < final_kw.length; j++) {
//   keywords_string += final_kw[j] + '\n'
// }
// fs.writeFile('./constants/tfidf.txt', tfidf_string, (err) => {
//   if (err) {
//     console.error(err)
//     return
//   }
// })
// fs.writeFile('./constants/idf.txt', idf_string, (err) => {
//   if (err) {
//     console.error(err)
//     return
//   }
// })
// fs.writeFile('./constants/keywords.txt', keywords_string, (err) => {
//   if (err) {
//     console.error(err)
//     return
//   }
// })

//reading the contents from the constants folder

let final_kw = fs.readFileSync(__dirname + '/constants/keywords.txt', {
  encoding: 'utf-8',
})
final_kw = final_kw.split('\n')
let idf = fs.readFileSync(__dirname + '/constants/idf.txt', {
  encoding: 'utf-8',
})
idf = idf.split('\n')
for (let i = 0; i < idf.length; i++) {
  idf[i] = parseFloat(idf[i])
}
let tfidf = fs.readFileSync(__dirname + '/constants/tfidf.txt', {
  encoding: 'utf-8',
})
tfidf = tfidf.split('\n')
let tfidf2 = []
for (let i = 0; i < 1450; i++) {
  let row_tfidf = []
  for (let j = 0; j < final_kw.length; j++) {
    let cur = parseFloat(tfidf[i * final_kw.length + j])
    // tfidf.shift()
    row_tfidf.push(cur)
  }
  tfidf2.push(row_tfidf)
}
tfidf = tfidf2
let ps_titles = fs.readFileSync(__dirname + '/dataset/problem_titles.txt', {
  encoding: 'utf-8',
})
ps_titles = ps_titles.split('\n')
let ps_difficulties = fs.readFileSync(
  __dirname + '/dataset/problem_difficulties.txt',
  {
    encoding: 'utf-8',
  }
)
ps_difficulties = ps_difficulties.split('\n')
let ps_submissions = fs.readFileSync(
  __dirname + '/dataset/problem_submissions.txt',
  {
    encoding: 'utf-8',
  }
)
ps_submissions = ps_submissions.split('\n')
let ps_urls = fs.readFileSync(__dirname + '/dataset/problem_urls.txt', {
  encoding: 'utf-8',
})
ps_urls = ps_urls.split('\n')
let ps_codes = fs.readFileSync(__dirname + '/dataset/problem_codes.txt', {
  encoding: 'utf-8',
})
ps_codes = ps_codes.split('\n')

// setting up the express app
const app = express()
const dbURI =
  'mongodb+srv://adarsh_modi_01:adarsh_modi_01@nodetuts.ei3k1.mongodb.net/node-tuts2?retryWrites=true&w=majority'
const PORT = process.env.PORT || 3000
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(PORT)
    console.log('mongoDb connected successfully')
  })
  .catch((err) => console.log(err))

// register view engine
app.set('view engine', 'ejs')

// middleware & static files
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use((req, res, next) => {
  res.locals.path = req.path
  next()
})

//adding data to the mongoDb datebase

// for (let i = 0; i < 1450; i++) {
//   cur_tfidf = []
//   let sum = 0
//   for (let j = i * final_kw.length; j < (i + 1) * final_kw.length; j++) {
//     cur_tfidf.push(parseFloat(tfidf[j]))
//     sum += parseFloat(tfidf[j])
//   }
//   // ps_statement = ''
//   // const readStream = fs.createReadStream(
//   //   './dataset/ps/ps_' + (i + 1).toString() + '.txt'
//   // )
//   // readStream.on('data', (chunk) => {
//   //   ps_statement += chunk.toString()
//   // })
//   let ps_statement = fs.readFileSync(
//     __dirname + '/dataset/ps/ps_' + (i + 1).toString() + '.txt',
//     {
//       encoding: 'utf-8',
//     }
//   )
//   ps_statement = ps_statement.toString()
//   const question = new Blog({
//     index_of_ps: i + 1,
//     title: ps_titles[i],
//     code: ps_codes[i],
//     diff: parseInt(ps_difficulties[i]),
//     submissions: parseInt(ps_submissions[i]),
//     url_ps: ps_urls[i],
//     // tfidf: cur_tfidf,
//     statement: ps_statement,
//   })
//   question
//     .save()
//     .then((result) => {
//       // res.redirect('/blogs')
//       console.log('data added successfully')
//     })
//     .catch((err) => {
//       console.log(err)
//     })
// }
top10_questions_copy = []

// routes

app.get('/', (req, res) => {
  // res.redirect('/blogs')
  console.log('search reached')
  res.redirect('/questions')
})

// question routes
app.get('/questions/search', (req, res) => {
  res.render('search', { title: 'Search a question' })
})

app.get('/questions', (req, res) => {
  top10_questions_copy = []
  for (let i = 1; i < 15; i++) {
    top10_questions_copy.push(i)
  }
  Blog.find({
    index_of_ps: { $in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  })
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render('index', {
        questions: result,
        title: 'All Questions',
        query: '',
      })
    })
    .catch((err) => {
      console.log(err)
    })
  console.log('/questions reached')
})

function cleaner(pss) {
  let punctuationless = pss.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
  pss = punctuationless.replace(/\s{2,}/g, ' ')
  pss = pss.replace(/\d+/g, '')
  pss = pss.replace(/\s+/g, ' ').trim()
  pss = pss.replace(',', ' ')
  pss = pss.replace(/[^\w\s]/g, '').toLowerCase()
  return pss
}

function return_query_tfidf(q) {
  q = cleaner(q)
  let query_keywords = []
  q = q.split(' ')
  query_keywords = q
  for (let j = 0; j < query_keywords.length; j++) {
    query_keywords[j] = porterStemmer(query_keywords[j])
    if (dict.search(query_keywords[j])[0] != undefined)
      query_keywords[j] = dict.search(query_keywords[j])[0].word
  }
  console.log('query after stemming and lemetization', query_keywords)
  query_tf = []
  for (let j = 0; j < final_kw.length; j++) {
    query_tf.push(0)
  }
  if (query_keywords.length == 0) {
    console.log('query_keyword length is 0')
  }
  for (let j = 0; j < query_keywords.length; j++) {
    if (final_kw.indexOf(query_keywords[j]) != -1)
      query_tf[final_kw.indexOf(query_keywords[j])] += 1
  }
  query_tfidf = []
  for (let j = 0; j < final_kw.length; j++) {
    query_tfidf.push(query_tf[j])
    query_tfidf[j] = (query_tfidf[j] * idf[j]) / query_keywords.length
  }
  return query_tfidf
}

function calc_similarity(a, b) {
  sum = 0
  sum1 = 0
  sum2 = 0
  for (let i = 0; i < final_kw.length; i++) {
    sum += parseFloat(a[i] * b[i])
    sum1 += parseFloat(a[i] * a[i])
    sum2 += parseFloat(b[i] * b[i])
  }
  sum1 = Math.sqrt(sum1)
  sum2 = Math.sqrt(sum2)
  sum3 = sum1 * sum2
  if (sum3 == 0) return 0
  return sum / sum3
}

function top10(q) {
  query_tfidf = return_query_tfidf(q)
  all_questions = []
  for (let i = 0; i < 1450; i++) {
    let cur_tfidf = tfidf[i]
    similarity_value = calc_similarity(query_tfidf, cur_tfidf)
    all_questions.push([similarity_value, i])
  }
  all_questions.sort((a, b) => (a[0] > b[0] ? -1 : 1))
  top10_questions = []
  for (let i = 0; i < 15; i++) {
    top10_questions.push(all_questions[i][1] + 1)
  }
  return top10_questions
}
let cur_query = ''
app.post('/questions', (req, res) => {
  if (req.body.category != undefined) {
    sort_by = req.body.category
    all_questions = []
    setTimeout(() => {
      if (sort_by === 'code') {
        Blog.find({ index_of_ps: { $in: top10_questions_copy } })
          .sort({ code: 1 })
          .then((question) => {
            res.render('index', {
              questions: question,
              title: 'Blogs',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      } else if (sort_by === 'diff') {
        Blog.find({ index_of_ps: { $in: top10_questions_copy } })
          .sort({ diff: 1 })
          .then((question) => {
            res.render('index', {
              questions: question,
              title: 'Blogs',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      } else {
        Blog.find({ index_of_ps: { $in: top10_questions_copy } })
          .sort({ submissions: 1 })
          .then((question) => {
            res.render('index', {
              questions: question,
              title: 'Blogs',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }, 500)
  } else {
    let query_cleaned = req.body.query
    query_cleaned = cleaner(query_cleaned)
    top10_questions = top10(query_cleaned)
    top10_questions_copy = top10_questions
    all_questions = []
    Blog.aggregate([
      { $match: { index_of_ps: { $in: top10_questions } } },
      {
        $addFields: {
          __top10_questions: {
            $indexOfArray: [top10_questions, '$index_of_ps'],
          },
        },
      },
      { $sort: { __top10_questions: 1 } },
    ])
      .then((question) => {
        res.render('index', {
          questions: question,
          title: 'Questions',
          query: req.body.query,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }
})

function format_contraints(constraints) {
  constraints = constraints.split(' ')

  for (let i = 0; i < constraints.length; i++) {
    if (constraints[i] === '\\leq') constraints[i] = '<='
    if (constraints[i] === '\\geq') constraints[i] = '>='
  }
  constraints = constraints.join(' ')
  return constraints
}
function format_contraints2(constraints) {
  for (let i = 0; i < constraints.length; i++) {
    if (constraints[i][0] === ',') constraints[i] = constraints[i].substr(1)
    if (constraints[i] != '\r' && constraints[i].length > 2) {
      let curLen = constraints[i].length
      let left = constraints[i].substr(0, (curLen - 1) / 2)
      let right = constraints[i].substr((curLen - 1) / 2, (curLen - 1) / 2)
      if (left === right) {
        constraints[i] = left + '\r'
      }
    }
  }
  return constraints
}

app.post('/feedbacks', (req, res) => {
  const fb = new Fb(req.body)
  setTimeout(() => {
    fb.save()
      .then((result) => {
        res.redirect('/feedbacks')
      })
      .catch((err) => {
        console.log(err)
      })
  }, 1800)
})

app.get('/feedbacks', (req, res) => {
  Fb.find({})
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render('feedback', { feedbacks: result, title: 'All Feedbacks' })
    })
    .catch((err) => {
      console.log(err)
    })
  // res.render('feedback', { title: 'All Feedbacks' })
  console.log('/feedbacks reached')
})

app.get('/questions/:id', (req, res) => {
  const id = req.params.id
  Blog.findById(id)
    .then((result) => {
      let statement = result.statement
      statement = statement.split('$')
      statement = statement.join()

      let last = statement[0]
      statement2 = last
      for (let i = 1; i < statement.length; i++) {
        if (
          !(
            statement[i] === last && statement[i].toUpperCase() === statement[i]
          )
        ) {
          statement2 += statement[i]
          last = statement[i]
        }
      }
      statement = statement2
      let ps = ''
      statement = statement.split('Constraints')
      ps = statement[0]

      statement = statement[1]
      subtasks = ''
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }
      if ((statement.match('Subtasks') || []).length != 0) {
        statement = statement.split('Subtasks')
        constraints = statement[0]
        constraints = format_contraints(constraints)
        constraints = constraints.split('\n')
        constraints = format_contraints2(constraints)
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
        statement = statement.split('Sample Input')
        subtasks = statement[0]
        subtasks = format_contraints(subtasks)
        subtasks = subtasks.split('\n')
        subtasks = format_contraints2(subtasks)
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
      } else {
        statement = statement.split('Sample Input')
        constraints = statement[0]
        constraints = format_contraints(constraints)
        constraints = constraints.split('\n')
        constraints = format_contraints2(constraints)
        subtasks = []
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
      }
      statement = statement.split('Sample Output')
      sample_input = statement[0].split('\n')
      statement = statement[1]
      sample_output = []
      explanation = []
      if ((statement.match('Explanation') || []).length != 0) {
        statement = statement.split('Explanation')
        sample_output = statement[0].split('\n')
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
        statement = statement.split('Author')
        explanation = statement[0].split('\n')
      } else {
        statement = statement.split('Author')
        sample_output = statement[0].split('\n')
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
      }

      statement = ps
      if ((statement.match('Input Format') || []).length != 0) {
        statement = statement.split('Input Format')
        ps = statement[0].split('\n')
        statement = statement[1]
      } else {
        statement = statement.split('Input')
        ps = statement[0].split('\n')
        statement = statement[1]
      }
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }

      if ((statement.match('Output Format') || []).length != 0) {
        statement = statement.split('Output Format')
        input = statement[0].split('\n')
        statement = statement[1]
      } else {
        statement = statement.split('Output')
        input = statement[0].split('\n')
        if (input[0] === ':\r') input.shift()
        statement = statement[1]
      }
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }
      output = statement.split('\n')
      if (output[0] === ':\r') output.shift()
      subtask_len = subtasks.length
      res.render('details', {
        question: result,
        title: 'Problem Statement',
        details: {
          ps,
          input,
          output,
          constraints,
          subtasks,
          subtask_len,
          sample_input,
          sample_output,
          explanation,
        },
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

// 404 page
app.use((req, res) => {
  res.render('error', { title: 'PAGE NOT FOUND' })
})
