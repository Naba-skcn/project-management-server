const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express(); 
const port = process.env.PORT || 5000;

// Middleware
const corsOptions = {
    origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'http://localhost:5175',
       ''
    ],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(bodyParser.json());
   
  console.log(process.env.DB_PASS)
  
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8bgsx7j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      const projectsCollection = client.db('projectDB').collection('projects');
      const tasksCollection = client.db('projectDB').collection('tasks');
      
// Get all projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await projectsCollection.find().toArray();
        res.send(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send({ message: 'Failed to fetch projects' });
    }
  });

 // Get tasks for a specific project
app.get('/projects/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { status, priority } = req.query;
    
    try {
      const query = { projectId };
      if (status) query.status = status;
      if (priority) query.priority = priority;
  
      const tasks = await tasksCollection.find(query).toArray();
      res.send(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).send({ message: 'Failed to fetch tasks' });
    }
  });

 
 // Get details of task by ID
 app.get('/tasks/:id', async (req, res) => {
    const{ id } = req.params;
    const details = await tasksCollection.findOne({ _id: new ObjectId(id) });
    res.send(details);
});

// Update a task by ID
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
  
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    const updateData = { ...req.body };
    delete updateData._id;
  
    try {
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
  
      if (result.modifiedCount === 1) {
        return res.send({ message: 'task successfully updated' });
      } else {
        return res.status(404).send({ message: 'task not found' });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).send({ message: 'Failed to update task', error });
    }
  });

   // Delete task
   app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  });
  

  // Add a new task
app.post('/addTask', async (req, res) => {
    const newTask = req.body;

    try {
        // Insert the new task into the tasks collection
        const result = await tasksCollection.insertOne(newTask);
        
        // Check if the task was inserted successfully
        if (result.insertedId) {
            res.status(201).send({
                message: 'Task added successfully',
                taskId: result.insertedId
            });
        } else {
            res.status(500).send({
                message: 'Failed to add task'
            });
        }
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).send({
            message: 'An error occurred while adding the task',
            error
        });
    }
});

  

    } finally {
      // Ensures that the client will close when you finish/error
      //await client.close();
    }
  }
  run().catch(console.dir);
  



  // This should stay open and handle requests
 app.get('/', (req, res) => {
    res.send('TaskTrackr server is running');
  });

  app.listen(port, () => {
    console.log(`TaskTrackr server is running on port: ${port}`);
  });

  