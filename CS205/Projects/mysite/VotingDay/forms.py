from django import forms

class UserForm(forms.Form):
    emailid = forms.CharField(label='email', max_length=50)
    studentid = forms.CharField(label='id', max_length=15)
