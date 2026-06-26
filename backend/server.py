from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
import json
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / 'videos').mkdir(exist_ok=True)
(UPLOAD_DIR / 'certificates').mkdir(exist_ok=True)
(UPLOAD_DIR / 'images').mkdir(exist_ok=True)

FONTS_DIR = ROOT_DIR / 'fonts'
pdfmetrics.registerFont(TTFont('DejaVuSans', str(FONTS_DIR / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', str(FONTS_DIR / 'DejaVuSans-Bold.ttf')))

JWT_SECRET = os.environ.get('JWT_SECRET', 'profit-team-jwt-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Token gerekli')
    token = auth.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail='Kullanici bulunamadi')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token suresi dolmus')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Gecersiz token')

def require_roles(*roles):
    async def checker(request: Request):
        user = await get_current_user(request)
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail='Yetkiniz yok')
        return user
    return checker

def clean_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in ['_id', 'password_hash']}

# ============ PYDANTIC MODELS ============

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = 'distributor'
    upper_leader: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    upper_leader: Optional[str] = None

class CourseCreate(BaseModel):
    title: str
    description: str = ''
    thumbnail: str = ''
    passing_rate: int = 80

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    passing_rate: Optional[int] = None

class ModuleCreate(BaseModel):
    title: str
    description: str = ''
    order: int = 0

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class VideoCreate(BaseModel):
    title: str
    description: str = ''
    url: str = ''
    video_type: str = 'youtube'
    order: int = 0
    duration: int = 0

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    video_type: Optional[str] = None
    order: Optional[int] = None
    duration: Optional[int] = None

class QuizCreate(BaseModel):
    passing_rate: int = 80
    questions: list = []

class QuizSubmit(BaseModel):
    answers: dict

class AssignCourse(BaseModel):
    user_id: str
    course_id: str

async def enrich_user(user: dict) -> dict:
    """Resolve upper_leader ID to name"""
    result = clean_user(user)
    if result.get('upper_leader'):
        leader = await db.users.find_one({'id': result['upper_leader']}, {'_id': 0, 'full_name': 1})
        result['upper_leader_name'] = leader['full_name'] if leader else result['upper_leader']
    else:
        result['upper_leader_name'] = None
    return result

# ============ AUTH ROUTES ============

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({'email': req.email}, {'_id': 0})
    if not user or not verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='E-posta veya sifre hatali')
    token = create_token(user['id'], user['role'])
    return {'token': token, 'user': await enrich_user(user)}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return await enrich_user(user)

# ============ USER ROUTES ============

@api_router.post("/users")
async def create_user(user_data: UserCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    if user_data.role == 'super_admin' and current['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail='Super Admin olusturma yetkiniz yok')
    if user_data.role == 'admin' and current['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail='Admin olusturma yetkiniz yok')
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Bu e-posta zaten kayitli')
    user = {
        'id': str(uuid.uuid4()),
        'email': user_data.email,
        'password_hash': hash_password(user_data.password),
        'full_name': user_data.full_name,
        'role': user_data.role,
        'upper_leader': user_data.upper_leader,
        'level': 'baslangic',
        'badges': [],
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current['id']
    }
    await db.users.insert_one(user)
    return clean_user(user)

@api_router.get("/users")
async def list_users(request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    users = await db.users.find({}, {'_id': 0, 'password_hash': 0}).to_list(1000)
    # Resolve upper_leader names
    for u in users:
        if u.get('upper_leader'):
            leader = await db.users.find_one({'id': u['upper_leader']}, {'_id': 0, 'full_name': 1})
            u['upper_leader_name'] = leader['full_name'] if leader else u['upper_leader']
        else:
            u['upper_leader_name'] = None
    return users

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin'] and current['id'] != user_id:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password_hash': 0})
    if not user:
        raise HTTPException(status_code=404, detail='Kullanici bulunamadi')
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if 'password' in update:
        update['password_hash'] = hash_password(update.pop('password'))
    if update:
        await db.users.update_one({'id': user_id}, {'$set': update})
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password_hash': 0})
    return user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    current = await get_current_user(request)
    target = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not target:
        raise HTTPException(status_code=404, detail='Kullanici bulunamadi')
    if target['role'] == 'super_admin' and current['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail='Super Admin silemezsiniz')
    if current['role'] == 'admin' and target['role'] in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Bu kullaniciyi silemezsiniz')
    await db.users.delete_one({'id': user_id})
    await db.assignments.delete_many({'user_id': user_id})
    await db.progress.delete_many({'user_id': user_id})
    return {'message': 'Kullanici silindi'}

# ============ COURSE ROUTES ============

@api_router.post("/courses")
async def create_course(course_data: CourseCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    course = {
        'id': str(uuid.uuid4()),
        'title': course_data.title,
        'description': course_data.description,
        'thumbnail': course_data.thumbnail,
        'passing_rate': course_data.passing_rate,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': current['id']
    }
    await db.courses.insert_one(course)
    return {k: v for k, v in course.items() if k != '_id'}

@api_router.get("/courses")
async def list_courses(request: Request):
    current = await get_current_user(request)
    if current['role'] in ['super_admin', 'admin']:
        courses = await db.courses.find({}, {'_id': 0}).to_list(1000)
    else:
        assignments = await db.assignments.find({'user_id': current['id']}, {'_id': 0}).to_list(1000)
        course_ids = [a['course_id'] for a in assignments]
        courses = await db.courses.find({'id': {'$in': course_ids}}, {'_id': 0}).to_list(1000)
    for course in courses:
        modules = await db.modules.find({'course_id': course['id']}, {'_id': 0}).sort('order', 1).to_list(100)
        course['module_count'] = len(modules)
        video_count = await db.videos.count_documents({'course_id': course['id']})
        course['video_count'] = video_count
    return courses

@api_router.get("/courses/{course_id}")
async def get_course(course_id: str, request: Request):
    current = await get_current_user(request)
    course = await db.courses.find_one({'id': course_id}, {'_id': 0})
    if not course:
        raise HTTPException(status_code=404, detail='Egitim bulunamadi')
    if current['role'] == 'distributor':
        assignment = await db.assignments.find_one({'user_id': current['id'], 'course_id': course_id})
        if not assignment:
            raise HTTPException(status_code=403, detail='Bu egitime erisim yetkiniz yok')
    modules = await db.modules.find({'course_id': course_id}, {'_id': 0}).sort('order', 1).to_list(100)
    for module in modules:
        videos = await db.videos.find({'module_id': module['id']}, {'_id': 0}).sort('order', 1).to_list(100)
        for video in videos:
            quiz = await db.quizzes.find_one({'video_id': video['id']}, {'_id': 0})
            video['has_quiz'] = quiz is not None
            if current['role'] == 'distributor':
                prog = await db.progress.find_one({'user_id': current['id'], 'video_id': video['id']}, {'_id': 0})
                video['progress'] = prog
        module['videos'] = videos
    course['modules'] = modules
    return course

@api_router.put("/courses/{course_id}")
async def update_course(course_id: str, course_data: CourseUpdate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {k: v for k, v in course_data.model_dump().items() if v is not None}
    if update:
        await db.courses.update_one({'id': course_id}, {'$set': update})
    course = await db.courses.find_one({'id': course_id}, {'_id': 0})
    return course

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    await db.courses.delete_one({'id': course_id})
    await db.modules.delete_many({'course_id': course_id})
    await db.videos.delete_many({'course_id': course_id})
    await db.quizzes.delete_many({'course_id': course_id})
    await db.assignments.delete_many({'course_id': course_id})
    await db.progress.delete_many({'course_id': course_id})
    return {'message': 'Egitim silindi'}

# ============ MODULE ROUTES ============

@api_router.post("/courses/{course_id}/modules")
async def create_module(course_id: str, module_data: ModuleCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    module_count = await db.modules.count_documents({'course_id': course_id})
    module = {
        'id': str(uuid.uuid4()),
        'course_id': course_id,
        'title': module_data.title,
        'description': module_data.description,
        'order': module_data.order if module_data.order else module_count + 1,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.modules.insert_one(module)
    return {k: v for k, v in module.items() if k != '_id'}

@api_router.get("/courses/{course_id}/modules")
async def list_modules(course_id: str, request: Request):
    await get_current_user(request)
    modules = await db.modules.find({'course_id': course_id}, {'_id': 0}).sort('order', 1).to_list(100)
    return modules

@api_router.put("/modules/{module_id}")
async def update_module(module_id: str, module_data: ModuleUpdate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {k: v for k, v in module_data.model_dump().items() if v is not None}
    if update:
        await db.modules.update_one({'id': module_id}, {'$set': update})
    module = await db.modules.find_one({'id': module_id}, {'_id': 0})
    return module

@api_router.delete("/modules/{module_id}")
async def delete_module(module_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    module = await db.modules.find_one({'id': module_id}, {'_id': 0})
    if module:
        await db.videos.delete_many({'module_id': module_id})
        await db.quizzes.delete_many({'module_id': module_id})
        await db.modules.delete_one({'id': module_id})
    return {'message': 'Modul silindi'}

# ============ VIDEO ROUTES ============

@api_router.post("/modules/{module_id}/videos")
async def create_video(module_id: str, video_data: VideoCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    module = await db.modules.find_one({'id': module_id}, {'_id': 0})
    if not module:
        raise HTTPException(status_code=404, detail='Modul bulunamadi')
    video_count = await db.videos.count_documents({'module_id': module_id})
    video = {
        'id': str(uuid.uuid4()),
        'module_id': module_id,
        'course_id': module['course_id'],
        'title': video_data.title,
        'description': video_data.description,
        'url': video_data.url,
        'video_type': video_data.video_type,
        'order': video_data.order if video_data.order else video_count + 1,
        'duration': video_data.duration,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.videos.insert_one(video)
    return {k: v for k, v in video.items() if k != '_id'}

@api_router.post("/videos/upload")
async def upload_video(file: UploadFile = File(...), request: Request = None):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    file_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
    file_path = UPLOAD_DIR / 'videos' / f'{file_id}.{ext}'
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    return {'url': f'/api/uploads/videos/{file_id}.{ext}', 'filename': file.filename}

@api_router.put("/videos/{video_id}")
async def update_video(video_id: str, video_data: VideoUpdate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {k: v for k, v in video_data.model_dump().items() if v is not None}
    if update:
        await db.videos.update_one({'id': video_id}, {'$set': update})
    video = await db.videos.find_one({'id': video_id}, {'_id': 0})
    return video

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    await db.quizzes.delete_many({'video_id': video_id})
    await db.videos.delete_one({'id': video_id})
    return {'message': 'Video silindi'}

# ============ QUIZ ROUTES ============

@api_router.post("/videos/{video_id}/quiz")
async def create_quiz(video_id: str, quiz_data: QuizCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    video = await db.videos.find_one({'id': video_id}, {'_id': 0})
    if not video:
        raise HTTPException(status_code=404, detail='Video bulunamadi')
    existing = await db.quizzes.find_one({'video_id': video_id})
    if existing:
        await db.quizzes.delete_one({'video_id': video_id})
    quiz = {
        'id': str(uuid.uuid4()),
        'video_id': video_id,
        'module_id': video['module_id'],
        'course_id': video['course_id'],
        'passing_rate': quiz_data.passing_rate,
        'questions': quiz_data.questions,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.quizzes.insert_one(quiz)
    return {k: v for k, v in quiz.items() if k != '_id'}

@api_router.get("/videos/{video_id}/quiz")
async def get_quiz(video_id: str, request: Request):
    await get_current_user(request)
    quiz = await db.quizzes.find_one({'video_id': video_id}, {'_id': 0})
    if not quiz:
        raise HTTPException(status_code=404, detail='Quiz bulunamadi')
    return quiz

@api_router.put("/quizzes/{quiz_id}")
async def update_quiz(quiz_id: str, quiz_data: QuizCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {'passing_rate': quiz_data.passing_rate, 'questions': quiz_data.questions}
    await db.quizzes.update_one({'id': quiz_id}, {'$set': update})
    quiz = await db.quizzes.find_one({'id': quiz_id}, {'_id': 0})
    return quiz

@api_router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    await db.quizzes.delete_one({'id': quiz_id})
    return {'message': 'Quiz silindi'}

@api_router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, submission: QuizSubmit, request: Request):
    current = await get_current_user(request)
    quiz = await db.quizzes.find_one({'id': quiz_id}, {'_id': 0})
    if not quiz:
        raise HTTPException(status_code=404, detail='Quiz bulunamadi')
    questions = quiz['questions']
    total = len(questions)
    correct = 0
    results = []
    for i, q in enumerate(questions):
        user_answer = submission.answers.get(str(i))
        is_correct = user_answer == q.get('correct_answer')
        if is_correct:
            correct += 1
        results.append({
            'question': q['question'],
            'user_answer': user_answer,
            'correct_answer': q['correct_answer'],
            'is_correct': is_correct
        })
    score = (correct / total * 100) if total > 0 else 0
    passed = score >= quiz['passing_rate']
    prog = await db.progress.find_one({
        'user_id': current['id'],
        'video_id': quiz['video_id']
    }, {'_id': 0})
    quiz_attempts = (prog.get('quiz_attempts', 0) if prog else 0) + 1
    await db.progress.update_one(
        {'user_id': current['id'], 'video_id': quiz['video_id']},
        {'$set': {
            'quiz_passed': passed,
            'quiz_attempts': quiz_attempts,
            'last_quiz_score': score,
            'quiz_completed_at': datetime.now(timezone.utc).isoformat() if passed else None
        }},
        upsert=True
    )
    if passed:
        await check_course_completion(current['id'], quiz['course_id'])
    return {
        'passed': passed,
        'score': score,
        'correct': correct,
        'total': total,
        'passing_rate': quiz['passing_rate'],
        'results': results,
        'quiz_attempts': quiz_attempts
    }

# ============ PROGRESS ROUTES ============

@api_router.post("/progress/video-complete")
async def mark_video_complete(request: Request):
    current = await get_current_user(request)
    body = await request.json()
    video_id = body.get('video_id')
    video = await db.videos.find_one({'id': video_id}, {'_id': 0})
    if not video:
        raise HTTPException(status_code=404, detail='Video bulunamadi')
    existing = await db.progress.find_one({
        'user_id': current['id'],
        'video_id': video_id
    }, {'_id': 0})
    if existing and existing.get('video_watched'):
        return {'message': 'Video zaten tamamlandi', 'progress': existing}
    await db.progress.update_one(
        {'user_id': current['id'], 'video_id': video_id},
        {'$set': {
            'user_id': current['id'],
            'video_id': video_id,
            'module_id': video['module_id'],
            'course_id': video['course_id'],
            'video_watched': True,
            'video_completed_at': datetime.now(timezone.utc).isoformat()
        },
        '$setOnInsert': {
            'id': str(uuid.uuid4()),
            'quiz_passed': False,
            'quiz_attempts': 0,
            'last_quiz_score': 0
        }},
        upsert=True
    )
    prog = await db.progress.find_one({'user_id': current['id'], 'video_id': video_id}, {'_id': 0})
    return {'message': 'Video tamamlandi', 'progress': prog}

@api_router.post("/progress/reset-video")
async def reset_video_progress(request: Request):
    current = await get_current_user(request)
    body = await request.json()
    video_id = body.get('video_id')
    await db.progress.update_one(
        {'user_id': current['id'], 'video_id': video_id},
        {'$set': {'video_watched': False}}
    )
    return {'message': 'Video ilerlemesi sifirlandi'}

@api_router.get("/progress/course/{course_id}")
async def get_course_progress(course_id: str, request: Request):
    current = await get_current_user(request)
    user_id = request.query_params.get('user_id', current['id'])
    if user_id != current['id'] and current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    progress_list = await db.progress.find({
        'user_id': user_id,
        'course_id': course_id
    }, {'_id': 0}).to_list(1000)
    modules = await db.modules.find({'course_id': course_id}, {'_id': 0}).sort('order', 1).to_list(100)
    total_videos = 0
    completed_videos = 0
    passed_quizzes = 0
    total_quizzes = 0
    for module in modules:
        videos = await db.videos.find({'module_id': module['id']}, {'_id': 0}).sort('order', 1).to_list(100)
        total_videos += len(videos)
        for video in videos:
            prog = next((p for p in progress_list if p.get('video_id') == video['id']), None)
            if prog and prog.get('video_watched'):
                completed_videos += 1
            quiz = await db.quizzes.find_one({'video_id': video['id']})
            if quiz:
                total_quizzes += 1
                if prog and prog.get('quiz_passed'):
                    passed_quizzes += 1
    percentage = (completed_videos / total_videos * 100) if total_videos > 0 else 0
    return {
        'course_id': course_id,
        'user_id': user_id,
        'total_videos': total_videos,
        'completed_videos': completed_videos,
        'total_quizzes': total_quizzes,
        'passed_quizzes': passed_quizzes,
        'percentage': round(percentage, 1),
        'progress_details': progress_list
    }

@api_router.get("/progress/user/{user_id}")
async def get_user_progress(user_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin'] and current['id'] != user_id:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    assignments = await db.assignments.find({'user_id': user_id}, {'_id': 0}).to_list(100)
    result = []
    for assignment in assignments:
        course = await db.courses.find_one({'id': assignment['course_id']}, {'_id': 0})
        if not course:
            continue
        progress_list = await db.progress.find({
            'user_id': user_id,
            'course_id': assignment['course_id']
        }, {'_id': 0}).to_list(1000)
        total_videos = await db.videos.count_documents({'course_id': assignment['course_id']})
        completed = sum(1 for p in progress_list if p.get('video_watched') and p.get('quiz_passed'))
        percentage = (completed / total_videos * 100) if total_videos > 0 else 0
        result.append({
            'course': course,
            'assignment': assignment,
            'total_videos': total_videos,
            'completed': completed,
            'percentage': round(percentage, 1)
        })
    return result

# ============ ASSIGNMENT ROUTES ============

@api_router.post("/assignments")
async def assign_course(data: AssignCourse, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    existing = await db.assignments.find_one({
        'user_id': data.user_id,
        'course_id': data.course_id
    })
    if existing:
        raise HTTPException(status_code=400, detail='Bu egitim zaten atanmis')
    assignment = {
        'id': str(uuid.uuid4()),
        'user_id': data.user_id,
        'course_id': data.course_id,
        'assigned_by': current['id'],
        'assigned_at': datetime.now(timezone.utc).isoformat(),
        'completed': False,
        'completed_at': None
    }
    await db.assignments.insert_one(assignment)
    return {k: v for k, v in assignment.items() if k != '_id'}

@api_router.get("/assignments")
async def list_assignments(request: Request):
    current = await get_current_user(request)
    if current['role'] in ['super_admin', 'admin']:
        query = {}
        if request.query_params.get('user_id'):
            query['user_id'] = request.query_params['user_id']
    else:
        query = {'user_id': current['id']}
    assignments = await db.assignments.find(query, {'_id': 0}).to_list(1000)
    return assignments

@api_router.delete("/assignments/{assignment_id}")
async def remove_assignment(assignment_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    await db.assignments.delete_one({'id': assignment_id})
    return {'message': 'Atama kaldirildi'}

# ============ QUALIFICATION ROUTES ============

class QualificationCreate(BaseModel):
    title: str
    cover_image: str = ''
    content: str = ''
    category: str = 'genel'

class QualificationUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None

@api_router.post("/qualifications")
async def create_qualification(data: QualificationCreate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    qual = {
        'id': str(uuid.uuid4()),
        'title': data.title,
        'cover_image': data.cover_image,
        'content': data.content,
        'category': data.category,
        'author_id': current['id'],
        'author_name': current['full_name'],
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    await db.qualifications.insert_one(qual)
    return {k: v for k, v in qual.items() if k != '_id'}

@api_router.get("/qualifications")
async def list_qualifications(request: Request):
    await get_current_user(request)
    quals = await db.qualifications.find({}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return quals

@api_router.get("/qualifications/{qual_id}")
async def get_qualification(qual_id: str, request: Request):
    await get_current_user(request)
    qual = await db.qualifications.find_one({'id': qual_id}, {'_id': 0})
    if not qual:
        raise HTTPException(status_code=404, detail='Kalifikasyon bulunamadi')
    return qual

@api_router.put("/qualifications/{qual_id}")
async def update_qualification(qual_id: str, data: QualificationUpdate, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()
    if update:
        await db.qualifications.update_one({'id': qual_id}, {'$set': update})
    qual = await db.qualifications.find_one({'id': qual_id}, {'_id': 0})
    return qual

@api_router.delete("/qualifications/{qual_id}")
async def delete_qualification(qual_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    await db.qualifications.delete_one({'id': qual_id})
    return {'message': 'Kalifikasyon silindi'}

@api_router.post("/qualifications/upload-image")
async def upload_qualification_image(file: UploadFile = File(...), request: Request = None):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    file_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    file_path = UPLOAD_DIR / 'images' / f'qual_{file_id}.{ext}'
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    return {'url': f'/api/uploads/images/qual_{file_id}.{ext}'}

# ============ REPORT ROUTES ============

@api_router.get("/leaderboard")
async def get_leaderboard(request: Request):
    await get_current_user(request)
    distributors = await db.users.find({'role': 'distributor'}, {'_id': 0, 'password_hash': 0}).to_list(1000)
    leaderboard = []
    for user in distributors:
        assignments = await db.assignments.find({'user_id': user['id']}, {'_id': 0}).to_list(100)
        completed_courses = sum(1 for a in assignments if a.get('completed'))
        total_assigned = len(assignments)
        progress_list = await db.progress.find({'user_id': user['id']}, {'_id': 0}).to_list(10000)
        total_quiz_passed = sum(1 for p in progress_list if p.get('quiz_passed'))
        total_quiz_attempts = sum(p.get('quiz_attempts', 0) for p in progress_list)
        total_videos_watched = sum(1 for p in progress_list if p.get('video_watched'))
        total_score_sum = sum(p.get('last_quiz_score', 0) for p in progress_list if p.get('quiz_passed'))
        avg_quiz_score = (total_score_sum / total_quiz_passed) if total_quiz_passed > 0 else 0
        # Points: completed courses * 100 + quizzes passed * 20 + videos watched * 5
        points = completed_courses * 100 + total_quiz_passed * 20 + total_videos_watched * 5
        # Overall progress across all assigned courses
        total_videos_in_courses = 0
        for a in assignments:
            vc = await db.videos.count_documents({'course_id': a['course_id']})
            total_videos_in_courses += vc
        overall_progress = (total_videos_watched / total_videos_in_courses * 100) if total_videos_in_courses > 0 else 0
        leaderboard.append({
            'user_id': user['id'],
            'full_name': user['full_name'],
            'email': user['email'],
            'level': user.get('level', 'baslangic'),
            'badges': user.get('badges', []),
            'completed_courses': completed_courses,
            'total_assigned': total_assigned,
            'total_quiz_passed': total_quiz_passed,
            'total_quiz_attempts': total_quiz_attempts,
            'total_videos_watched': total_videos_watched,
            'avg_quiz_score': round(avg_quiz_score, 1),
            'overall_progress': round(overall_progress, 1),
            'points': points
        })
    leaderboard.sort(key=lambda x: (-x['points'], -x['completed_courses'], -x['avg_quiz_score']))
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1
    return leaderboard

@api_router.get("/reports/dashboard")
async def get_dashboard_reports(request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    total_distributors = await db.users.count_documents({'role': 'distributor'})
    total_admins = await db.users.count_documents({'role': 'admin'})
    total_courses = await db.courses.count_documents({})
    completed_assignments = await db.assignments.count_documents({'completed': True})
    total_assignments = await db.assignments.count_documents({})
    total_quiz_attempts = 0
    total_quiz_fails = 0
    all_progress = await db.progress.find({}, {'_id': 0}).to_list(10000)
    for p in all_progress:
        total_quiz_attempts += p.get('quiz_attempts', 0)
        if p.get('quiz_attempts', 0) > 0 and not p.get('quiz_passed', False):
            total_quiz_fails += p.get('quiz_attempts', 0)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_users = await db.users.find({
        'role': 'distributor'
    }, {'_id': 0, 'password_hash': 0}).to_list(1000)
    return {
        'total_distributors': total_distributors,
        'total_admins': total_admins,
        'total_courses': total_courses,
        'completed_assignments': completed_assignments,
        'total_assignments': total_assignments,
        'total_quiz_attempts': total_quiz_attempts,
        'total_quiz_fails': total_quiz_fails,
        'recent_users': recent_users[:10]
    }

@api_router.get("/reports/user/{user_id}")
async def get_user_report(user_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password_hash': 0})
    if not user:
        raise HTTPException(status_code=404, detail='Kullanici bulunamadi')
    assignments = await db.assignments.find({'user_id': user_id}, {'_id': 0}).to_list(100)
    courses_detail = []
    for a in assignments:
        course = await db.courses.find_one({'id': a['course_id']}, {'_id': 0})
        if not course:
            continue
        modules = await db.modules.find({'course_id': a['course_id']}, {'_id': 0}).sort('order', 1).to_list(100)
        module_details = []
        for m in modules:
            videos = await db.videos.find({'module_id': m['id']}, {'_id': 0}).sort('order', 1).to_list(100)
            video_details = []
            for v in videos:
                prog = await db.progress.find_one({'user_id': user_id, 'video_id': v['id']}, {'_id': 0})
                video_details.append({
                    'video': v,
                    'progress': prog
                })
            module_details.append({
                'module': m,
                'videos': video_details
            })
        total_videos = await db.videos.count_documents({'course_id': a['course_id']})
        progress_list = await db.progress.find({'user_id': user_id, 'course_id': a['course_id']}, {'_id': 0}).to_list(1000)
        completed = sum(1 for p in progress_list if p.get('video_watched') and p.get('quiz_passed'))
        percentage = (completed / total_videos * 100) if total_videos > 0 else 0
        courses_detail.append({
            'course': course,
            'assignment': a,
            'modules': module_details,
            'total_videos': total_videos,
            'completed': completed,
            'percentage': round(percentage, 1)
        })
    return {
        'user': user,
        'courses': courses_detail
    }

# ============ CERTIFICATE ROUTES ============

async def check_course_completion(user_id: str, course_id: str):
    videos = await db.videos.find({'course_id': course_id}, {'_id': 0}).to_list(1000)
    if not videos:
        return
    all_complete = True
    for video in videos:
        prog = await db.progress.find_one({
            'user_id': user_id,
            'video_id': video['id']
        }, {'_id': 0})
        quiz = await db.quizzes.find_one({'video_id': video['id']})
        if not prog or not prog.get('video_watched'):
            all_complete = False
            break
        if quiz and not prog.get('quiz_passed'):
            all_complete = False
            break
    if all_complete:
        await db.assignments.update_one(
            {'user_id': user_id, 'course_id': course_id},
            {'$set': {'completed': True, 'completed_at': datetime.now(timezone.utc).isoformat()}}
        )
        existing_cert = await db.certificates.find_one({'user_id': user_id, 'course_id': course_id})
        if not existing_cert:
            cert_id = str(uuid.uuid4())
            cert = {
                'id': cert_id,
                'user_id': user_id,
                'course_id': course_id,
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'qr_code': cert_id
            }
            await db.certificates.insert_one(cert)
        await update_user_level(user_id)

async def update_user_level(user_id: str):
    completed_count = await db.assignments.count_documents({'user_id': user_id, 'completed': True})
    levels = [
        (0, 'baslangic'),
        (1, 'aktif_distributor'),
        (2, 'takim_kurucu'),
        (3, 'lider'),
        (5, 'elite_leader')
    ]
    level = 'baslangic'
    for threshold, lvl in levels:
        if completed_count >= threshold:
            level = lvl
    badges = []
    if completed_count >= 1:
        badges.append('ilk_egitim')
    if completed_count >= 3:
        badges.append('uc_egitim')
    if completed_count >= 5:
        badges.append('elite')
    await db.users.update_one({'id': user_id}, {'$set': {'level': level, 'badges': badges}})

@api_router.get("/certificates/user/{user_id}")
async def get_user_certificates(user_id: str, request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin'] and current['id'] != user_id:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    certs = await db.certificates.find({'user_id': user_id}, {'_id': 0}).to_list(100)
    for cert in certs:
        course = await db.courses.find_one({'id': cert['course_id']}, {'_id': 0})
        cert['course_title'] = course['title'] if course else 'Bilinmeyen Egitim'
        user = await db.users.find_one({'id': cert['user_id']}, {'_id': 0, 'password_hash': 0})
        cert['user_name'] = user['full_name'] if user else 'Bilinmeyen'
    return certs

@api_router.get("/certificates/{cert_id}/download")
async def download_certificate(cert_id: str, request: Request):
    cert = await db.certificates.find_one({'id': cert_id}, {'_id': 0})
    if not cert:
        raise HTTPException(status_code=404, detail='Sertifika bulunamadi')
    user = await db.users.find_one({'id': cert['user_id']}, {'_id': 0})
    course = await db.courses.find_one({'id': cert['course_id']}, {'_id': 0})
    # Fetch upper leader name
    upper_leader_name = ''
    if user and user.get('upper_leader'):
        leader = await db.users.find_one({'id': user['upper_leader']}, {'_id': 0, 'full_name': 1})
        if leader:
            upper_leader_name = leader.get('full_name', '')
    pdf_path = UPLOAD_DIR / 'certificates' / f'{cert_id}.pdf'
    c = canvas.Canvas(str(pdf_path), pagesize=landscape(A4))
    width, height = landscape(A4)
    c.setFillColor(HexColor('#111111'))
    c.rect(0, 0, width, height, fill=True)
    c.setStrokeColor(HexColor('#00C853'))
    c.setLineWidth(2)
    c.rect(30, 30, width - 60, height - 60)
    c.setFillColor(HexColor('#00C853'))
    c.setFont('DejaVuSans-Bold', 36)
    c.drawCentredString(width / 2, height - 100, u'PROFİT TEAM')
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('DejaVuSans', 18)
    c.drawCentredString(width / 2, height - 140, u'BAŞARI SERTİFİKASI')
    c.setFont('DejaVuSans', 14)
    c.drawCentredString(width / 2, height - 200, u'Bu sertifika ile onaylanır ki')
    c.setFillColor(HexColor('#00C853'))
    c.setFont('DejaVuSans-Bold', 28)
    user_name = user['full_name'] if user else 'Bilinmeyen'
    c.drawCentredString(width / 2, height - 250, user_name)
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('DejaVuSans', 14)
    course_title = course['title'] if course else u'Bilinmeyen Eğitim'
    c.drawCentredString(width / 2, height - 300, f'"{course_title}" eğitimini başarıyla tamamlamıştır.')
    completed_at = cert.get('completed_at', '')
    if completed_at:
        try:
            dt = datetime.fromisoformat(completed_at)
            date_str = dt.strftime('%d.%m.%Y')
        except Exception:
            date_str = completed_at[:10]
    else:
        date_str = ''
    c.setFont('DejaVuSans', 12)
    c.drawCentredString(width / 2, height - 340, f'Tamamlanma Tarihi: {date_str}')
    if upper_leader_name:
        c.setFillColor(HexColor('#00C853'))
        c.setFont('DejaVuSans-Bold', 13)
        c.drawCentredString(width / 2, 100, u'Tebrik ederim, Başarıların ve Eğitiminin Devamını Dilerim.')
        c.setFont('DejaVuSans', 12)
        c.setFillColor(HexColor('#FFFFFF'))
        c.drawCentredString(width / 2, 78, f'\u2014 {upper_leader_name}')
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('DejaVuSans', 8)
    c.drawCentredString(width / 2, 45, f'Doğrulama: {cert_id}')
    c.save()
    return FileResponse(str(pdf_path), media_type='application/pdf', filename=f'sertifika_{cert_id}.pdf')

@api_router.get("/certificates/{cert_id}/story-image")
async def certificate_story_image(cert_id: str, request: Request):
    cert = await db.certificates.find_one({'id': cert_id}, {'_id': 0})
    if not cert:
        raise HTTPException(status_code=404, detail='Sertifika bulunamadi')
    user = await db.users.find_one({'id': cert['user_id']}, {'_id': 0})
    course = await db.courses.find_one({'id': cert['course_id']}, {'_id': 0})
    upper_leader_name = ''
    if user and user.get('upper_leader'):
        leader = await db.users.find_one({'id': user['upper_leader']}, {'_id': 0, 'full_name': 1})
        if leader:
            upper_leader_name = leader.get('full_name', '')
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1080, 1920
    img = Image.new('RGB', (W, H), '#111111')
    draw = ImageDraw.Draw(img)
    font_path = str(FONTS_DIR / 'DejaVuSans.ttf')
    font_bold_path = str(FONTS_DIR / 'DejaVuSans-Bold.ttf')
    font_title = ImageFont.truetype(font_bold_path, 64)
    font_subtitle = ImageFont.truetype(font_path, 36)
    font_name = ImageFont.truetype(font_bold_path, 54)
    font_body = ImageFont.truetype(font_path, 30)
    font_small = ImageFont.truetype(font_path, 24)
    font_leader = ImageFont.truetype(font_bold_path, 28)
    # Green border
    draw.rectangle([30, 30, W - 30, H - 30], outline='#00C853', width=3)
    # Inner accent lines
    draw.rectangle([50, 50, W - 50, H - 50], outline='#1a1a1a', width=1)
    # Top decorative line
    draw.rectangle([100, 300, W - 100, 303], fill='#00C853')
    # Title
    draw.text((W / 2, 200), u'PROF\u0130T TEAM', fill='#00C853', font=font_title, anchor='mm')
    # Subtitle
    draw.text((W / 2, 370), u'BA\u015eARI SERT\u0130F\u0130KASI', fill='#FFFFFF', font=font_subtitle, anchor='mm')
    # Decorative line below subtitle
    draw.rectangle([100, 420, W - 100, 423], fill='#00C853')
    # Trophy icon area
    draw.text((W / 2, 530), u'\u2605', fill='#00C853', font=ImageFont.truetype(font_path, 80), anchor='mm')
    # Body text
    draw.text((W / 2, 660), u'Bu sertifika ile onayla\u0131r ki', fill='#AAAAAA', font=font_body, anchor='mm')
    # User name
    user_name = user['full_name'] if user else 'Bilinmeyen'
    draw.text((W / 2, 770), user_name, fill='#00C853', font=font_name, anchor='mm')
    # Decorative lines around name
    draw.rectangle([200, 820, W - 200, 822], fill='#333333')
    # Course title
    course_title = course['title'] if course else u'Bilinmeyen E\u011fitim'
    draw.text((W / 2, 900), f'"{course_title}"', fill='#FFFFFF', font=font_body, anchor='mm')
    draw.text((W / 2, 950), u'e\u011fitimini ba\u015far\u0131yla tamamlam\u0131\u015ft\u0131r.', fill='#FFFFFF', font=font_body, anchor='mm')
    # Date
    completed_at = cert.get('completed_at', '')
    if completed_at:
        try:
            dt = datetime.fromisoformat(completed_at)
            date_str = dt.strftime('%d.%m.%Y')
        except Exception:
            date_str = completed_at[:10]
    else:
        date_str = ''
    draw.text((W / 2, 1050), f'Tamamlanma Tarihi: {date_str}', fill='#888888', font=font_small, anchor='mm')
    # Upper leader message
    if upper_leader_name:
        draw.rectangle([100, 1200, W - 100, 1203], fill='#00C853')
        draw.text((W / 2, 1280), u'Tebrik ederim,', fill='#00C853', font=font_leader, anchor='mm')
        draw.text((W / 2, 1330), u'Ba\u015far\u0131lar\u0131n ve E\u011fitiminin', fill='#00C853', font=font_leader, anchor='mm')
        draw.text((W / 2, 1380), u'Devam\u0131n\u0131 Dilerim.', fill='#00C853', font=font_leader, anchor='mm')
        draw.text((W / 2, 1450), f'\u2014 {upper_leader_name}', fill='#FFFFFF', font=font_small, anchor='mm')
    # Bottom branding
    draw.rectangle([100, H - 200, W - 100, H - 197], fill='#00C853')
    draw.text((W / 2, H - 140), u'PROF\u0130T TEAM AKADEM\u0130', fill='#555555', font=font_small, anchor='mm')
    # Save
    img_path = UPLOAD_DIR / 'certificates' / f'{cert_id}_story.png'
    img.save(str(img_path), 'PNG', quality=95)
    return FileResponse(str(img_path), media_type='image/png', filename=f'sertifika_{cert_id}_story.png')

@api_router.get("/certificates/{cert_id}/verify")
async def verify_certificate(cert_id: str):
    cert = await db.certificates.find_one({'id': cert_id}, {'_id': 0})
    if not cert:
        raise HTTPException(status_code=404, detail='Sertifika bulunamadi')
    user = await db.users.find_one({'id': cert['user_id']}, {'_id': 0, 'password_hash': 0})
    course = await db.courses.find_one({'id': cert['course_id']}, {'_id': 0})
    return {
        'valid': True,
        'user_name': user['full_name'] if user else 'Bilinmeyen',
        'course_title': course['title'] if course else 'Bilinmeyen',
        'completed_at': cert.get('completed_at')
    }

# ============ FILE SERVING ============

@api_router.get("/uploads/videos/{filename}")
async def serve_video(filename: str):
    file_path = UPLOAD_DIR / 'videos' / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='Dosya bulunamadi')
    return FileResponse(str(file_path))

@api_router.get("/uploads/images/{filename}")
async def serve_image(filename: str):
    file_path = UPLOAD_DIR / 'images' / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='Dosya bulunamadi')
    return FileResponse(str(file_path))

# ============ SITE SETTINGS ROUTES ============

DEFAULT_SETTINGS = {
    'id': 'site_settings',
    'logo_url': '',
    'login_bg_url': 'https://images.unsplash.com/photo-1758518731468-98e90ffd7430?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHxjb3Jwb3JhdGUlMjBsZWFkZXJzaGlwJTIwdGVhbSUyMG1lZXRpbmclMjBtb2Rlcm4lMjBvZmZpY2V8ZW58MHx8fHwxNzcxMTkzMjk1fDA&ixlib=rb-4.1.0&q=85',
    'login_title_line1': 'Lider Yetistirme Platformu',
    'login_title_line2': '',
    'login_subtitle': "ProFit Team'e Hos Geldin! Lider olma yolunda hizlica ivmelenin!",
    'stats': [
        {'label': 'Egitim Saati', 'value': '500+'},
        {'label': 'Mezun', 'value': '1000+'},
        {'label': 'Memnuniyet', 'value': '98%'}
    ]
}

@api_router.get("/settings")
async def get_settings():
    settings = await db.site_settings.find_one({'id': 'site_settings'}, {'_id': 0})
    if not settings:
        return DEFAULT_SETTINGS
    return settings

@api_router.put("/settings")
async def update_settings(request: Request):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    body = await request.json()
    body['id'] = 'site_settings'
    await db.site_settings.update_one(
        {'id': 'site_settings'},
        {'$set': body},
        upsert=True
    )
    settings = await db.site_settings.find_one({'id': 'site_settings'}, {'_id': 0})
    return settings

@api_router.post("/settings/upload-logo")
async def upload_logo(file: UploadFile = File(...), request: Request = None):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    file_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    file_path = UPLOAD_DIR / 'images' / f'logo_{file_id}.{ext}'
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    url = f'/api/uploads/images/logo_{file_id}.{ext}'
    await db.site_settings.update_one(
        {'id': 'site_settings'},
        {'$set': {'id': 'site_settings', 'logo_url': url}},
        upsert=True
    )
    return {'url': url}

@api_router.post("/settings/upload-bg")
async def upload_bg(file: UploadFile = File(...), request: Request = None):
    current = await get_current_user(request)
    if current['role'] not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail='Yetkiniz yok')
    file_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    file_path = UPLOAD_DIR / 'images' / f'bg_{file_id}.{ext}'
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    url = f'/api/uploads/images/bg_{file_id}.{ext}'
    await db.site_settings.update_one(
        {'id': 'site_settings'},
        {'$set': {'id': 'site_settings', 'login_bg_url': url}},
        upsert=True
    )
    return {'url': url}

# ============ INCLUDE ROUTER & MIDDLEWARE ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ STARTUP ============

@app.on_event("startup")
async def startup():
    existing = await db.users.find_one({'email': 'hikos5255@gmail.com'})
    if not existing:
        admin = {
            'id': str(uuid.uuid4()),
            'email': 'hikos5255@gmail.com',
            'password_hash': hash_password('19901990Aa.'),
            'full_name': 'Hikmet Can İBİÇ',
            'role': 'super_admin',
            'upper_leader': None,
            'level': 'elite_leader',
            'badges': ['founder'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': 'system'
        }
        await db.users.insert_one(admin)
        logger.info("Super Admin olusturuldu: hikos5255@gmail.com")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
